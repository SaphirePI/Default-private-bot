let ch = ''; //заполните id канала оповещений

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
                .get(ch)
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
