var __async = (__this, __arguments, generator) => {
  return new Promise((resolve, reject) => {
    var fulfilled = (value) => {
      try {
        step(generator.next(value));
      } catch (e) {
        reject(e);
      }
    };
    var rejected = (value) => {
      try {
        step(generator.throw(value));
      } catch (e) {
        reject(e);
      }
    };
    var step = (x) => x.done ? resolve(x.value) : Promise.resolve(x.value).then(fulfilled, rejected);
    step((generator = generator.apply(__this, __arguments)).next());
  });
};

// src/streamingcommunity/index.js
module.exports = {
  getStreams: (id, type, season, episode) => __async(null, null, function* () {
    try {
      const url = `https://maxmehlab91-es.hf.space/resolve/streamingcommunity?id=${id}&type=${type}&s=${season || 1}&ep=${episode || 1}`;
      const response = yield fetch(url);
      const data = yield response.json();
      return data.streams || [];
    } catch (e) {
      console.error("[streamingcommunity-Client] API Error:", e.message);
      return [];
    }
  })
};
