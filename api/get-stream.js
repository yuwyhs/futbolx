import crypto from 'crypto';

export default function handler(req, res) {
  const { stream } = req.query;
  
  if (!stream) {
    return res.status(400).send("Error: Please provide a stream name.");
  }

  // These will be pulled safely from your Vercel Environment Variables
  const secretKey = process.env.FLUSSONIC_SECRET_KEY; 
  const flussonicBase = process.env.FLUSSONIC_BASE_URL; 

  // 1. Setup Time (Current time minus 5 mins buffer, valid for 3 hours)
  const lifetime = 3600 * 3;
  const startTime = Math.floor(Date.now() / 1000) - 300;
  const endTime = startTime + lifetime;
  
  // 2. Generate Random Salt
  const salt = crypto.randomBytes(8).toString('hex');

  // 3. Create Flussonic SHA1 Hash: stream + start + end + key + salt
  const stringToHash = stream + startTime + endTime + secretKey + salt;
  const hash = crypto.createHash('sha1').update(stringToHash).digest('hex');

  // 4. Assemble the Token
  const token = `${hash}-${salt}-${endTime}-${startTime}`;

  // 5. Build the Secure Redirect URL
  const secureUrl = `${flussonicBase}/${stream}/index.m3u8?token=${token}`;

  // 6. Redirect the player to the secure link
  res.redirect(302, secureUrl);
}
