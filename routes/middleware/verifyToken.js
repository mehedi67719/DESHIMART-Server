const admin = require("firebase-admin");

const serviceAccount = require("../../deshimartfirebaseadminsdk.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});



const verifyToken = async (req, res, next) => {
    const authHeader = req.headers.authorization;


    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({ message: "No token provided" });
    }

    const token = authHeader.split(" ")[1];


    // console.log("Received token:", token);



    if (!token) {
        return res.status(401).send({ message: "unauthorize access" })
    }
    // req.token = token;

    try {

        const decoded = await admin.auth().verifyIdToken(token);
        // console.log(decoded);
        req.decoded_email=decoded.email;
        next();
    }
    catch (err) {
        return res.status(401).send({ message: "unauthorize access" })
    }


};

module.exports = verifyToken;