// auth.js

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.userRole = null;
        this.userCollege = null;
    }

    // SIGNUP
    async signup(email, password, name, college) {
        if (!email || !password || !name || !college) {
            throw new Error('Please fill all fields');
        }

        try {
            const result = await auth.createUserWithEmailAndPassword(email, password);
            const uid = result.user.uid;
            const collegeId = 'college_' + Date.now();

            // Create user doc
            await db.collection('users').doc(uid).set({
                email,
                displayName: name,
                role: 'admin',
                collegeId,
                createdAt: new Date().toISOString()
            });

            // Create college doc
            await db.collection('colleges').doc(collegeId).set({
                name: college,
                location: { lat: 40.599, lng: -75.290 },
                admin_id: uid,
                createdAt: new Date().toISOString()
            });

            this.currentUser = result.user;
            return { success: true, message: 'Account created successfully!' };
        } catch (error) {
            throw new Error('Signup failed: ' + error.message);
        }
    }

    // SIGNIN
    async signin(email, password) {
        try {
            const result = await auth.signInWithEmailAndPassword(email, password);
            this.currentUser = result.user;
            return { success: true, user: result.user };
        } catch (error) {
            throw new Error('Signin failed: ' + error.message);
        }
    }

    // LOGOUT
    async logout() {
        try {
            await auth.signOut();
            this.currentUser = null;
            this.userRole = null;
            this.userCollege = null;
            return { success: true };
        } catch (error) {
            throw new Error('Logout failed: ' + error.message);
        }
    }

    // LOAD USER DATA
    async loadUserData(uid) {
        try {
            const userDoc = await db.collection('users').doc(uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                this.userRole = userData.role;
                this.userCollege = userData.collegeId;
                return userData;
            }
            return null;
        } catch (error) {
            throw new Error('Failed to load user data: ' + error.message);
        }
    }

    // GETTERS
    getCurrentUser() {
        return this.currentUser;
    }

    getUserRole() {
        return this.userRole;
    }

    getUserCollege() {
        return this.userCollege;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Create global instance
window.authManager = new AuthManager();