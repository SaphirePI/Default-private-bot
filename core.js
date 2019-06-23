const Discord = require("discord.js");
const client = new Discord.Client({
  disableEveryone: true
});
const voice = {};
const mysql = require("mysql2");
const Enmap = require("enmap");
const fs = require("fs");
client.config = require("./config.json");
client.prefix = client.config.prefix ? client.config.prefix : ">";
client.commands = new Enmap();
const prefix = client.prefix;
const config = client.config;
const {
  token //-_____
} = config;

const con = mysql.createConnection({
  host: config.mysql.host,
  user: config.mysql.username,
  password: config.mysql.password,
  database: config.mysql.database
});

con.connect(err => {
  if (err) throw err;
  console.log("Подключен к базе данных!");
});
client.con = con;

client.on("ready", () => {
  console.log("%s is ready", client.user.tag);
  client.generateInvite(8).then(i => console.log(i));

  setInterval(() => {
    let voice = 0;
    client.guilds
      .get("590297210328186901")
      .channels.filter(chan => chan.type === "voice")
      .forEach(channel => {
        voice += channel.members.size;
      });
    client.channels
      .get("592024866295644170")
      .setName(`▪ Войс онлайн: ${voice}`);
    client.channels
      .get("592024959635816466")
      .setName(
        `▪ Участники: ${
          client.guilds.get("590297210328186901").members.filter(x => !x.bot)
            .size
        }`
      );
    client.channels.get("592024972776701964").setName(`▪ Economy: 401239`);
  }, 10000);
}); //ждем пока я его врублю и протестирую
//сделай ивент на сообщение (обработчик команд из файлов тоже сделай, и их лаунчер __-)
fs.readdir("./commands/", (err, files) => {
  if (err) console.log(err);
  let jsfile = files.filter(f => f.split(".").pop() === "js");
  if (jsfile.length <= 0) {
    console.log("Couldn't find commands.");
    return;
  }

  jsfile.forEach((f, i) => {
    let props = require(`./commands/${f}`);
    console.log(`${f} loaded!`);
    client.commands.set(props.help.name, props);
  });
});

client.on("voiceStateUpdate", (old, member) => {
  if (member.voiceChannelID === null || member.selfMute === true) {
    //null - leaved from voice; selfMute - muted himself
    clearInterval(voice[member.user.id]); // stop recording voice;
    return; // stop alg;
  } else {
    if (member.selfMute === true) return; //ignore if muted himself;
    if (old.voiceChannelID === member.voiceChannelID) return; //ignore this channel updates - anti layering voice recording;
    voice[member.user.id] = setInterval(() => {
      con.query(
        `SELECT * FROM users WHERE id = '${member.user.id}'`,
        (err, rows) => {
          if (!rows[0]) return; //ignore in not exits;
          //record 1 voice minute;
          con.query(
            `UPDATE users SET voicem = ${rows[0].voicem + 1}, voice = ${rows[0]
              .voice + 1}, money = ${rows[0].money + 20} WHERE id = '${
              member.user.id
            }'`
          );
          if (rows[0].voicem >= 60) {
            //record 1 voice hour, set voice minutes to 00;
            con.query(
              `UPDATE users SET voiceh = ${rows[0].voiceh +
                1}, voicem = 0 WHERE id = '${member.user.id}'`
            );
            if (rows[0].voiceh == 11) {
              client.channels
                .get("590297589602320416")
                .send(
                  `${member}, вы пробыли в голосовом канале 12 часов, цикл обнулен, вам выдан подарок.`
                );
              //Every 12 hours member will get 1 gift;
              con.query(
                `UPDATE users SET gifts = ${rows[0].gifts + 1} WHERE id = '${
                  member.user.id
                }'`
              );
            }
          }
        }
      );
    }, 60000);
  }
});

client.on("message", async message => {
  /* let [data] = await con.promise().execute(`SELECT * FROM users WHERE id = '${message.author.id}'`);
  if(data[0]) {
    con.promise().execute(`UPDATE users SET messages = ${data[0].messages + 1} WHERE id = '${message.author.id}'`);
  }   уберите км. если хотите нагружать вашу базу тупыми mysql потоками из-за сообщений -___*/
  let n = Math.random() * 1000 | 0;
  let n2 = Math.random() * 9999 | 0;
  console.log(n);
  if(n === 1) {
    message.channel.send(`Появился рандомный подарок, напишите \`claim ${n2}\` чтоб забрать его`)
    const filter = m => m.content === `claim ${n2}`;
    const collector = message.channel.createMessageCollector(filter, { time: 60000 });
    collector.on('collect', m => {
      message.channel.send(`${m.author} собрал подарок, он был добавлен в инветарь`);
      con.query(`SELECT * FROM users WHERE id = '${m.author.id}'`, (err, rows) => {
        if(!rows[0]) {
        con.query(`INSERT INTO users (id, gifts) VALUES ('${m.author.id}', 1)`)
        message.channel.send("Карта и профиль зарегистрирован");
        } else {
          client.con.promise().execute(`UPDATE users SET gifts = ${rows[0].gifts + 1} WHERE id = '${m.author.id}'`)
        }
      });
      
      collector.stop();
    });
  }

  const args = message.content
    .slice(prefix.length)
    .trim()
    .split(/ +/g);
  const command = args.shift().toLowerCase();
  if (message.author.bot) return;
  if (!message.content.startsWith(prefix)) return;
  if (message.channel.type == "dm") return;
  let commandfile = client.commands.get(command);
  if (commandfile) commandfile.run(client, message, args, con);
});

client.login(token);
