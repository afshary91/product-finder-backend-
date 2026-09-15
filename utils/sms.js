async function sendOtpSms(phone, code) {
  const apiKey = process.env.KAVENEGAR_API_KEY;
  const template = process.env.KAVENEGAR_TEMPLATE || 'verify';

  const url = `https://api.kavenegar.com/v1/${apiKey}/verify/lookup.json?receptor=${encodeURIComponent(
    phone
  )}&token=${encodeURIComponent(code)}&template=${encodeURIComponent(template)}`;

  const response = await fetch(url);
  const data = await response.json();

  if (data?.return?.status !== 200) {
    throw new Error(`خطا در ارسال پیامک: ${data?.return?.message || 'نامشخص'}`);
  }
  return data;
}

module.exports = { sendOtpSms };
