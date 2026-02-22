import crypto from 'crypto';

export default function handler(req, res) {
  const { stream } = req.query;
  if (!stream) return res.status(400).send("Missing stream parameter");

  const secretKey = process.env.FLUSSONIC_SECRET_KEY; 
  const flussonicBase = process.env.FLUSSONIC_BASE_URL; 

  const lifetime = 3600 * 3;
  const startTime = Math.floor(Date.now() / 1000) - 300;
  const endTime = startTime + lifetime;
  const salt = crypto.randomBytes(8).toString('hex');

  // THE FIX: We create the hash without the IP address
  const stringToHash = stream + startTime + endTime + secretKey + salt;
  const hash = crypto.createHash('sha1').update(stringToHash).digest('hex');

  // THE FIX: We add 'no_check_ip=true' to the token string
  const token = `${hash}-${salt}-${endTime}-${startTime}-no_check_ip=true`;

  const secureUrl = `${flussonicBase}/${stream}/index.m3u8?token=${token}`;
  res.redirect(302, secureUrl);
}
