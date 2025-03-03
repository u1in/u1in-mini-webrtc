let videoStream;

const signal = new Signal({
  wsUrl: "ws://127.0.0.1:3124",
});

signal.on("welcome", ({ senderId, payload: id }) => {
  document.getElementById("id").innerText = id;
});

signal.on("offer", ({ senderId, payload: offer }) => {
  signal
    .createPeer(senderId, (peer) => {
      if (videoStream) {
        videoStream.getTracks().map((track) => {
          peer.addTrack(track, videoStream);
        });
      }
      peer.ontrack = (event) => {
        createRemoteVideoDom(event, senderId);
      };
      return peer;
    })
    .saveOffer(offer)
    .createAnswer()
    .answer()
    .do();
});
const sendOffer = (targetId) => {
  signal
    .createPeer(targetId, (peer) => {
      if (videoStream) {
        videoStream.getTracks().map((track) => {
          peer.addTrack(track, videoStream);
        });
      }
      peer.ontrack = (event) => {
        createRemoteVideoDom(event, targetId);
      };
      return peer;
    })
    .createOffer()
    .offer()
    .do();
};

// 引导用户输入连接id函数
const connect = () => {
  const targetId = prompt("请输入对方ID:");
  if (targetId) {
    sendOffer(targetId);
  }
};

// 初始化函数
window.onload = async () => {
  videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  document.querySelector("#local-video").srcObject = videoStream;
};
``;
