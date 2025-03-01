// ws连接
let ws;
// webrtc连接池
let peers = new Map();
// 本机id
let id;
// 本机视频流
let videoStream;

// 生成好本机视频流并预览
const initStream = async () => {
  videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
  document.querySelector("#local-video").srcObject = videoStream;
};

// 使用ws连接到信令服务器
const initWs = () => {
  ws = new WebSocket(wsUrl);

  ws.onmessage = async (event) => {
    // 格式化相应
    const data = JSON.parse(event.data);
    // 获取对方id
    const { senderId } = data;
    // 连接池中挑选出对方的池（如有）
    const senderPeer = peers.get(senderId);

    // 初始化信令，这时候带来本机id
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

// 创建一个RTC连接
const createPeer = (targetId) => {
  // 先检查是否已有
  if (peers.get(targetId)) {
    throw new Error("peer is exist");
  }

  // 新建一个RTC连接，使用配置好的STUN服务器
  const currentPeer = new RTCPeerConnection({
    iceServers: [{ urls: stunUrl }],
  });

  peers.set(targetId, currentPeer);

  // 添加视频流
  if (videoStream) {
    videoStream.getTracks().map((track) => {
      currentPeer.addTrack(track, videoStream);
    });
  }

  // 添加信令候选的回调，当连接生成好网络候选方案时候通知对方
  // 注意这里，网络建立后也会触发一次事件，但是candidate为null，注意不要发送这个
  currentPeer.onicecandidate = ({ candidate }) => {
    if (candidate) {
      console.log(new Date().getTime(), "onicecandidate");
      ws.send(
        JSON.stringify({
          type: "candidate",
          targetId,
          payload: candidate,
        })
      );
    }
  };

  // 添加视频流回调，当对方发来视频流时候创建一个dom显示
  currentPeer.ontrack = (event) => {
    createRemoteVideoDom(event, targetId);
  };

  // 返回该连接
  return currentPeer;
};

// 移除媒体轨道，中止连接，网络信道还在
const pauseVideoTrack = (targetId) => {
  const targetPeer = peers.get(targetId);
  targetPeer.getSenders().map((sender) => {
    sender.replaceTrack(null);
  });
  ws.send(
    JSON.stringify({
      type: "pause",
      targetId,
      payload: null,
    })
  );
};

// 恢复媒体传输（尚未实现）
const resumeVideoTrack = (targetId) => {
  const targetPeer = peers.get(targetId);
  const tracks = videoStream.getTracks();
  targetPeer.getSenders().map((sender, index) => {
    sender.replaceTrack(tracks[index]);
  });
  createReconnectPeerDom(targetId);
};

// 销毁连接，移除dom
const destroyPeer = (targetId) => {
  const targetPeer = peers.get(targetId);
  targetPeer.close();
  peers.delete(targetId);
  destroyRemoteVideoDom(targetId);
};

// 处理接收到的offer，也就是处理别人的连接申请
const acceptOffer = async (senderId, offer) => {
  // 创建一个peer用于跟对方连接
  const acceptPeer = createPeer(senderId);
  // 设置好对方的描述信息
  await acceptPeer.setRemoteDescription(offer);
  // 生成我方的描述信息，在接收方叫answer
  const answer = await acceptPeer.createAnswer();
  // 保存我方的描述信息，从此刻开始开始进行网络候选，等待对方发送候选
  await acceptPeer.setLocalDescription(answer);

  // 将自己的描述信息，也就是answer发送给对方
  ws.send(
    JSON.stringify({
      type: "answer",
      targetId: senderId,
      payload: answer,
    })
  );
};

// 这里是作为发送方逻辑，也就是我们申请连接对方
const sendOffer = async (targetId) => {
  // 创建一个peer用于跟对方连接
  const senderPeer = createPeer(targetId);
  // 创建我方的描述信息，在发送方叫offer
  const offer = await senderPeer.createOffer();
  // 保存我方的描述信息，从此刻开始开始进行网络候选，等待对方发送候选
  await senderPeer.setLocalDescription(offer);

  // 将自己的描述信息，也就是offer发送给对方
  ws.send(
    JSON.stringify({
      type: "offer",
      targetId,
      payload: offer,
    })
  );
};

// 引导用户输入连接id函数
const connect = () => {
  const targetId = prompt("请输入对方ID:");
  if (targetId) {
    sendOffer(targetId);
  }
};

// 中止连接函数
const stop = (targetId) => {
  pauseVideoTrack(targetId);
  createLocalPeerStopDom(targetId);
};

// 终止连接函数
const bye = (targetId) => {
  destroyPeer(targetId);
  // 发送终止信令
  ws.send(
    JSON.stringify({
      type: "bye",
      targetId,
      payload: null,
    })
  );
};

// 恢复连接函数
const reconnect = (targetId) => {
  resumeVideoTrack(targetId);
};

// 初始化函数
window.onload = () => {
  initStream();
  initWs();
};
