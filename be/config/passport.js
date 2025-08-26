const passport = require('passport');
const GitHubStrategy = require('passport-github2').Strategy;
const { db } = require('./firebase');

// Only configure GitHub OAuth if credentials are available
if (process.env.GITHUB_CLIENT_ID && process.env.GITHUB_CLIENT_SECRET) {
  // Configure GitHub OAuth Strategy
  passport.use(new GitHubStrategy({
    clientID: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackURL: "/api/auth/github/callback"
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('GitHub OAuth callback received:', {
        profileId: profile?.id,
        username: profile?.username,
        emails: profile?.emails?.length || 0,
        photos: profile?.photos?.length || 0
      });

      // Validate profile data
      if (!profile || !profile.id) {
        console.error('Invalid GitHub profile data:', profile);
        return done(new Error('Invalid GitHub profile data'), null);
      }

      const githubId = profile.id.toString();
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
      const username = profile.username || profile.displayName || `github_${githubId}`;
      const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

      console.log('Processed GitHub data:', { githubId, email, username, avatar });

      if (!email) {
        console.error('GitHub account missing email');
        return done(new Error('GitHub account must have a public email address'), null);
      }

      // Check if user already exists
      const userQuery = await db.collection('users')
        .where('githubId', '==', githubId)
        .get();

      if (userQuery && !userQuery.empty && userQuery.docs && userQuery.docs.length > 0) {
        // User exists, return user
        const userDoc = userQuery.docs[0];
        const userData = userDoc.data ? userDoc.data() : userDoc; // Handle both real and mock DB
        return done(null, { 
          id: userDoc.id || userDoc._id || 'mock-user-id', 
          ...userData,
          accessToken 
        });
      }

      // Check if user exists by email
      const emailQuery = await db.collection('users')
        .where('email', '==', email)
        .get();

      if (emailQuery && !emailQuery.empty && emailQuery.docs && emailQuery.docs.length > 0) {
        // Link GitHub account to existing user
        const userDoc = emailQuery.docs[0];
        
        // Update user with GitHub info
        if (userDoc.ref && userDoc.ref.update) {
          await userDoc.ref.update({
            githubId: githubId,
            avatar: avatar,
            updatedAt: new Date().toISOString()
          });
        }
        
        const userData = userDoc.data ? userDoc.data() : userDoc; // Handle both real and mock DB
        return done(null, { 
          id: userDoc.id || userDoc._id || 'mock-user-id',
          ...userData,
          githubId: githubId,
          avatar: avatar,
          accessToken 
        });
      }

      // Create new user
      const newUser = {
        githubId: githubId,
        username: username,
        email: email,
        avatar: avatar,
        isEmailVerified: true, // GitHub emails are verified
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
        preferences: {
          theme: 'light',
          notifications: {
            email: true,
            push: false
          }
        }
      };

      const userRef = await db.collection('users').add(newUser);
      const userId = userRef.id || userRef._id || `github_${githubId}_${Date.now()}`;
      
      return done(null, { 
        id: userId, 
        ...newUser,
        accessToken 
      });

    } catch (error) {
      console.error('GitHub OAuth error:', error);
      return done(error, null);
    }
  }));

  console.log('✅ GitHub OAuth strategy configured');
} else {
  console.log('⚠️ GitHub OAuth credentials not found - GitHub authentication disabled');
}

// Serialize user for session
passport.serializeUser((user, done) => {
  done(null, user.id);
});

// Deserialize user from session
passport.deserializeUser(async (id, done) => {
  try {
    const userDoc = await db.collection('users').doc(id).get();
    if (userDoc && (userDoc.exists || userDoc.data)) {
      const userData = userDoc.data ? userDoc.data() : userDoc;
      done(null, { id: userDoc.id || id, ...userData });
    } else {
      done(null, false);
    }
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

module.exports = passport;
