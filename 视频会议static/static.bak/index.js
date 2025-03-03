const peers = new Map();

// 使用ws连接到信令服务器
const initWs = () => {
  ws = new WebSocket(wsUrl);

  ws.onmessage = async (event) => {
    const data = JSON.parse(event.data);
    const { senderId } = data;
    const senderPeer = peers.get(senderId);

    if (data.type === "welcome") {
      id = data.id;
      document.querySelector("#id").innerText = data.id;
      return;
    }
    // 连接信令，说明有人想连接我们
    if (data.type === "offer") {
      // 进行offer处理
      await acceptOffer(senderId, data.payload);
      return;
    }
    // 回应信令，说明我们申请连接有回应了
    if (data.type === "answer") {
      if (senderPeer) {
        await senderPeer.setRemoteDescription(data.payload);
        return;
      }
    }
    // 候选信令，说明对方已经准备好多个网络候选等待我们连接
    if (data.type === "candidate") {
      if (senderPeer) {
        await senderPeer.addIceCandidate(data.payload);
        return;
      }
    }
    // 中止信令，说明对方暂停传输媒体流
    if (data.type === "pause") {
      if (senderPeer) {
        createRemotePauseDom(senderId);
        return;
      }
    }
    // 恢复信令，说明对方恢复传输媒体流
    if (data.type === "resume") {
      if (senderPeer) {
        createReconnectPeerDom(senderId);
        return;
      }
    }
    // 终止信令，说明对方关闭连接
    if (data.type === "bye") {
      if (senderPeer) {
        peers.delete(senderId);
        byeRemoteVideoDom(senderId);
        return;
      }
    }
  };
};
const createPeer = (targetId) => {
  const peer = new RTCPeerConnection({
    iceServers: [
      {
        urls: "stun:stun.l.google.com:19302",
      },
    ],
  });

  peers.set(targetId, peer);

  peer.onicecandidate = (event) => {
    if (event.candidate) {
      console.log("new candidate");
    }
  };

  return peer;
};

const connect = async () => {
  const targetId = document.getElementById("targetId");
  const peer = createPeer(targetId.value);
  const offer = await peer.createOffer();
};

const send = () => {
  const targetId = document.getElementById("targetId");
  const sendText = document.getElementById("sendText");
};
