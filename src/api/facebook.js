const axios = require("axios");
async function getFacebookUserData(access_token) {
  const { data } = await axios({
    url: 'https://graph.facebook.com/me',
    method: 'get',
    params: {
      fields: ['id', 'email', 'first_name', 'last_name'].join(','),
      access_token
    },
  });
  console.log(data); // { id, email, first_name, last_name }
  return data;
};
async function getAcessTokenFromCode(code){
  const { data } = await axios({
    url: 'https://graph.facebook.com/v4.0/oauth/access_token',
    method: 'get',
    params: {
      client_id: process.env.FACEBOOK_APP_ID,
      client_secret: process.env.FACEBOOK_APP_SECRET,
      redirect_uri: 'http://localhost:3000/oauth',
      code,
    },
  });

  return data.access_token;
}
module.exports = {
  facebookcallback: async (req,res,next)=>{
    console.log("calling here")
    const code = req.query.code;
    try{
      const accessToken = await getAcessTokenFromCode(code);
      const profile = await getFacebookUserData(accessToken)
      res.json(profile)
    }catch(err){next(err)}

  
  }
}