const generateUniqueUsername = async (User,name,mobileNumber) => {
    const firstName = name.split(' ')[0];
    let isUnique = false;
    let username = '';
    let attempts = 0;

    while (!isUnique && attempts < 20) {
        let randomDigits = '';
        // Pick 3 random digits from mobileNumber
        if (mobileNumber && mobileNumber.length >= 3) {
            for (let i = 0; i < 3; i++) {
                const randomIndex = Math.floor(Math.random() * mobileNumber.length);
                randomDigits += mobileNumber[randomIndex];
            }
        } else {
            // Fallback if mobile number is too short or missing
            randomDigits = Math.floor(100 + Math.random() * 900).toString();
        }

        username = `${firstName}${randomDigits}`;

        // Check uniqueness
        const existingUser = await User.findOne({ username });
        if (!existingUser) {
            isUnique = true;
        }
        attempts++;
    }

    // Fallback if still not unique after 20 attempts
    if (!isUnique) {
        const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
        username = `${firstName}${randomSuffix}`;
    }

    return username;
};

module.exports = { generateUniqueUsername };
