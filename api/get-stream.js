import crypto from 'crypto';

export default function handler(req, res) {
  const { stream } = req.query;
  const secretKey = process.env.FLUSSONIC_SECRET_KEY; 
  const flussonicBase = process.env.FLUSSONIC_BASE_URL; 

  const lifetime = 3600 * 3;
  const startTime = Math.floor(Date.now() / 1000) - 300;
  const endTime = startTime + lifetime;
  const salt = crypto.randomBytes(8).toString('hex');

  // UPDATED HASH STRING: name + ip_string + start + end + key + salt
  // Use 'no_check_ip' in place of the IP address
  const stringToHash = stream + "no_check_ip" + startTime + endTime + secretKey + salt;
  
  const hash = crypto.createHash('sha1').update(stringToHash).digest('hex');

  // The token format must match the hash ingredients
  const token = `${hash}-${salt}-${endTime}-${startTime}-no_check_ip=true`;

  res.redirect(302, `${flussonicBase}/${stream}/index.m3u8?token=${token}`);
}
