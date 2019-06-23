// [Установка статуса сервера] //
let members = ''; //заполните id
let voiceOn = ''; //заполните id
let economy = ''; //заполните id
setInterval(() => {
    let voice = 0;
    client.guilds
      .get("590297210328186901")
      .channels.filter(chan => chan.type === "voice")
      .forEach(channel => {
        voice += channel.members.size;
      });
    client.channels
      .get(voiceOn)
      .setName(`▪ Войс онлайн: ${voice}`);
    client.channels
      .get(members)
      .setName(
        `▪ Участники: ${
          client.guilds.get(guild).members.filter(x => !x.bot)
            .size
        }`
      );
    client.channels.get(economy).setName(`▪ Economy: ${economySize}`);
  }, 10000);
