const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const passport = require("../config/passport");
const { db } = require("../config/firebase");
const { authenticateToken } = require("../middleware/auth");
const { validateSignup, validateSignin } = require("../middleware/validation");
const {
  generateVerificationKey,
  sendVerificationEmail,
  sendPasswordResetEmail,
} = require("../services/emailService");

const router = express.Router();

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// POST /auth/signup - Register new user
router.post("/signup", validateSignup, async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Check if user already exists
    const existingUserQuery = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (!existingUserQuery.empty) {
      return res.status(400).json({
        success: false,
        message: "User with this email already exists",
      });
    }

    // Check if username is taken
    const existingUsernameQuery = await db
      .collection("users")
      .where("username", "==", username)
      .limit(1)
      .get();

    if (!existingUsernameQuery.empty) {
      return res.status(400).json({
        success: false,
        message: "Username is already taken",
      });
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Generate 6-digit verification key
    const verificationKey = generateVerificationKey();

    // Create user document
    const userData = {
      username,
      email,
      password: hashedPassword,
      isEmailVerified: false,
      verificationKey,
      verificationKeyExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
      createdAt: new Date(),
      updatedAt: new Date(),
      avatar: null,
      bio: "",
      preferences: {
        theme: "light",
        notifications: {
          email: true,
          push: false,
        },
      },
    };

    // Save user to database
    const userRef = await db.collection("users").add(userData);

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(
        email,
        username,
        verificationKey
      );
      console.log(
        "✅ Verification email sent:",
        emailResult.previewUrl || "Email sent"
      );
    } catch (emailError) {
      console.error("❌ Failed to send verification email:", emailError);
      // Continue with registration even if email fails
    }

    // Generate JWT token
    const token = generateToken(userRef.id);

    // Return user data (without sensitive information)
    const responseUser = {
      id: userRef.id,
      username: userData.username,
      email: userData.email,
      isEmailVerified: userData.isEmailVerified,
      avatar: userData.avatar,
      bio: userData.bio,
      preferences: userData.preferences,
      createdAt: userData.createdAt,
    };

    res.status(201).json({
      success: true,
      message:
        "User registered successfully. Please check your email to verify your account.",
      user: responseUser,
      token,
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({
      success: false,
      message: "Registration failed. Please try again.",
    });
  }
});

// POST /auth/signin - Login user
router.post("/signin", validateSignin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user by email
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, userData.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate JWT token
    const token = generateToken(userId);

    // Update last login
    await db.collection("users").doc(userId).update({
      lastLoginAt: new Date(),
      updatedAt: new Date(),
    });

    // Return user data (without sensitive information)
    const responseUser = {
      id: userId,
      username: userData.username,
      email: userData.email,
      isEmailVerified: userData.isEmailVerified,
      avatar: userData.avatar,
      bio: userData.bio,
      preferences: userData.preferences,
      createdAt: userData.createdAt,
      lastLoginAt: new Date(),
    };

    res.json({
      success: true,
      message: "Login successful",
      user: responseUser,
      token,
    });
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).json({
      success: false,
      message: "Login failed. Please try again.",
    });
  }
});

// GET /auth/verify-email - Verify email address
router.get("/verify-email", async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "Verification token is required",
      });
    }

    // Find user with verification token
    const userQuery = await db
      .collection("users")
      .where("emailVerificationToken", "==", token)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification token",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Check if token is expired
    if (new Date() > userData.emailVerificationExpires.toDate()) {
      return res.status(400).json({
        success: false,
        message: "Verification token has expired",
      });
    }

    // Verify email
    await db.collection("users").doc(userId).update({
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Email verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
});

// POST /auth/resend-verification - Resend verification email
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    // Find user by email
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();
    const userId = userDoc.id;

    // Check if already verified
    if (userData.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new verification token
    const verificationToken = generateVerificationToken();

    // Update user with new token
    await db
      .collection("users")
      .doc(userId)
      .update({
        emailVerificationToken: verificationToken,
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        updatedAt: new Date(),
      });

    // Send verification email
    try {
      await sendVerificationEmail(
        userData.email,
        userData.username,
        verificationToken
      );
    } catch (emailError) {
      console.error("Failed to send verification email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.json({
      success: true,
      message: "Verification email sent successfully",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification email",
    });
  }
});

// GET /auth/me - Get current user info
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const user = req.user;

    // Remove sensitive information
    const responseUser = {
      id: user.id,
      username: user.username,
      email: user.email,
      isEmailVerified: user.isEmailVerified,
      avatar: user.avatar,
      bio: user.bio,
      preferences: user.preferences,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
    };

    res.json({
      success: true,
      user: responseUser,
    });
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get user information",
    });
  }
});

// POST /auth/logout - Logout user (client-side token removal)
router.post("/logout", authenticateToken, async (req, res) => {
  try {
    // Update last logout time
    await db.collection("users").doc(req.user.id).update({
      lastLogoutAt: new Date(),
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "Logout failed",
    });
  }
});

// GitHub OAuth Routes

// GET /auth/github - Initiate GitHub OAuth
router.get(
  "/github",
  passport.authenticate("github", {
    scope: ["user:email"],
  })
);

// GET /auth/github/callback - GitHub OAuth callback
router.get(
  "/github/callback",
  (req, res, next) => {
    passport.authenticate("github", { session: false }, (err, user, info) => {
      if (err) {
        console.error("GitHub OAuth authentication error:", err);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(
          `${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(
            err.message
          )}`
        );
      }

      if (!user) {
        console.error("GitHub OAuth authentication failed:", info);
        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        return res.redirect(
          `${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(
            "Authentication failed"
          )}`
        );
      }

      req.user = user;
      next();
    })(req, res, next);
  },
  async (req, res) => {
    try {
      if (!req.user || !req.user.id) {
        throw new Error("User data is missing after authentication");
      }

      // Generate JWT token for the authenticated user
      const token = generateToken(req.user.id);

      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${frontendUrl}/auth/callback?token=${token}&provider=github`
      );
    } catch (error) {
      console.error("GitHub OAuth callback error:", error);
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      res.redirect(
        `${frontendUrl}/login?error=oauth_failed&message=${encodeURIComponent(
          error.message
        )}`
      );
    }
  }
);

// POST /auth/github/link - Link GitHub account to existing user
router.post("/github/link", authenticateToken, async (req, res) => {
  try {
    const { githubToken } = req.body;

    if (!githubToken) {
      return res.status(400).json({
        success: false,
        message: "GitHub token is required",
      });
    }

    // Fetch GitHub user info
    const githubResponse = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${githubToken}`,
        "User-Agent": "MiniTrello",
      },
    });

    if (!githubResponse.ok) {
      return res.status(400).json({
        success: false,
        message: "Invalid GitHub token",
      });
    }

    const githubUser = await githubResponse.json();

    // Update user with GitHub info
    await db.collection("users").doc(req.user.id).update({
      githubId: githubUser.id.toString(),
      avatar: githubUser.avatar_url,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "GitHub account linked successfully",
    });
  } catch (error) {
    console.error("GitHub link error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to link GitHub account",
    });
  }
});

// POST /auth/verify-key - Verify email with 6-digit key
router.post("/verify-key", async (req, res) => {
  try {
    const { email, verificationKey } = req.body;

    if (!email || !verificationKey) {
      return res.status(400).json({
        success: false,
        message: "Email and verification key are required",
      });
    }

    // Find user by email
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if already verified
    if (userData.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Check if verification key matches
    if (userData.verificationKey !== verificationKey) {
      return res.status(400).json({
        success: false,
        message: "Invalid verification key",
      });
    }

    // Check if verification key has expired
    if (
      userData.verificationKeyExpires &&
      userData.verificationKeyExpires.toDate() < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Verification key has expired. Please request a new one.",
      });
    }

    // Update user as verified
    await db.collection("users").doc(userDoc.id).update({
      isEmailVerified: true,
      verificationKey: null,
      verificationKeyExpires: null,
      updatedAt: new Date(),
    });

    res.json({
      success: true,
      message: "Email verified successfully",
    });
  } catch (error) {
    console.error("Verification error:", error);
    res.status(500).json({
      success: false,
      message: "Email verification failed",
    });
  }
});

// POST /auth/resend-verification - Resend verification key
router.post("/resend-verification", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    // Find user by email
    const userQuery = await db
      .collection("users")
      .where("email", "==", email)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Check if already verified
    if (userData.isEmailVerified) {
      return res.status(400).json({
        success: false,
        message: "Email is already verified",
      });
    }

    // Generate new 6-digit verification key
    const verificationKey = generateVerificationKey();

    // Update user with new verification key
    await db
      .collection("users")
      .doc(userDoc.id)
      .update({
        verificationKey,
        verificationKeyExpires: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        updatedAt: new Date(),
      });

    // Send verification email
    try {
      const emailResult = await sendVerificationEmail(
        email,
        userData.username,
        verificationKey
      );
      console.log(
        "✅ Verification email resent:",
        emailResult.previewUrl || "Email sent"
      );
    } catch (emailError) {
      console.error("❌ Failed to resend verification email:", emailError);
      return res.status(500).json({
        success: false,
        message: "Failed to send verification email",
      });
    }

    res.json({
      success: true,
      message: "Verification key sent to your email",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to resend verification key",
    });
  }
});

module.exports = router;
