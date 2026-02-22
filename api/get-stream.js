import crypto from 'crypto';

export default function handler(req, res) {
  const { stream } = req.query;
  if (!stream) return res.status(400).send("Missing stream parameter");

  const secretKey = process.env.FLUSSONIC_SECRET_KEY; // 88292bbjsjsikw889qp
  const flussonicBase = process.env.FLUSSONIC_BASE_URL; // https://sixseven.futbol-x.site

  const lifetime = 3600 * 3; // 3 hours
  const startTime = Math.floor(Date.now() / 1000) - 300;
  const endTime = startTime + lifetime;
  const salt = crypto.randomBytes(8).toString('hex');

  // FLUSSONIC EXACT ORDER: streamname + starttime + endtime + secretkey + salt
  const stringToHash = stream + startTime + endTime + secretKey + salt;
  
  // Create SHA1 Hash
  const hash = crypto.createHash('sha1').update(stringToHash).digest('hex');

  // ASSEMBLE TOKEN: hash + salt + endtime + starttime
  // We add 'no_check_ip=true' because the request comes from Vercel's IP, not the user's
  const token = `${hash}-${salt}-${endTime}-${startTime}-no_check_ip=true`;

  const secureUrl = `${flussonicBase}/${stream}/index.m3u8?token=${token}`;
  
  res.redirect(302, secureUrl);
}
