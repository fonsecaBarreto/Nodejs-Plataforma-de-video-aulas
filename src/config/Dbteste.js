
const emails = [
  "josilva2422@gmail.com",
  "edson_m.calazans@hotmail.com",
  "larakeren@gmail.com",
  "estelacarvalho96@icloud.com",
  "patrickderekyee@gmail.com",
  "thaylasoares4@gmail.com",
  "luciana.antuness@yahoo.com.br",
  "mari_martins_13@hotmail.com",
  "karen.souza17@hotmail.com",
  "lararrramossantana@gmail.com",
  "celinabp0609@gmail.com",
  "hiagoragaza22@gmail.com",
  "davianebert@gmail.com",
  "drogariamr_me@hotmail.com",
  "asdjbahdbas@hotmail.com",
  "nadiavieiradonascimento123@gmail.com",
  "lucasfonsecabasdada@hotmail.com",
  "minhacasaminhavida@hotmail.com",
  "hiagoragazini22@gmail.com",
  "lucasmartinsvieira@hotmail.com",
  "clecirma@hotmail.com",
  "atakeoferreira@gmail.com",
  "lagosmana15@gmail.com.br",
  "fabrinedefanti@hotmail.com",
  "martinsbrunna18@gmail.com",
  "maggot.sic@hotmail.com",
  "aop_paixao@hotmail.com",
  "joaopedro_louzada@hotmail.com",
  "aanaluiza.figueiredo@hotamil.com",
  "lucascristinaedson@gmail.com",
  "laraly96@gmail.com",
  "jeffersoneambrosio@yahoo.com.br",
  "majuguerra95@gmail.com",
  "sthefanymattosaraujo@hotmail.com",
]
const password = "d!9Bfn";
const namePrefix = "Aluno"
async function create(){
  const done = await Promise.all(emails.map(async (e,i)=>{
    let name = namePrefix+(641+i);
    let path = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/([^\w]+|\s+)/g, '-')
    .replace(/\-\-+/g, '-').replace(/(^-+|-+$)/, '').toLowerCase();

    var done = await knex("students").insert({email:e,password,password_repeat:password,name,path}).returning("*");
    return done;
  }))
  console.log(done)
}

