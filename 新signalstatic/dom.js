const createRemoteVideoDom = (event, senderId) => {
  if (document.querySelector(`#id-${senderId}`)) {
    return;
  }
  const div = document.createElement("div");
  div.innerHTML = `
    <div id="id-${senderId}" class="video-box">
      <video autoplay muted></video>
      <div class="connect-info">
        <div class="connect-name">连接名：${senderId}</div>
        <div class="btns">
          <div class="stop" onclick="stop('${senderId}')">停止推流</div>
          <div class="reconnect" onclick="reconnect('${senderId}')">恢复连接</div>
          <div class="bye" onclick="bye('${senderId}')">结束连接</div>
        </div>
      </div>
      <div class="local-disconnect disconnect">我方已停止推流</div>
      <div class="remote-disconnect disconnect">对方已停止推流</div>
    </div>
    `;
  document.querySelector("#remote-video-list").appendChild(div);
  document.querySelector(`#id-${senderId} video`).srcObject = event.streams[0];
};

const createRemotePauseDom = (targetId) => {
  if (document.querySelector(`#id-${targetId} .remote-disconnect`)) {
    document.querySelector(`#id-${targetId} .remote-disconnect`).style.display =
      "flex";
  }
};

const createLocalPeerStopDom = (targetId) => {
  if (document.querySelector(`#id-${targetId} .local-disconnect`)) {
    document.querySelector(`#id-${targetId} .local-disconnect`).style.display =
      "flex";
  }
  if (document.querySelector(`#id-${targetId} .stop`)) {
    document.querySelector(`#id-${targetId} .stop`).style.display = "none";
  }
  if (document.querySelector(`#id-${targetId} .reconnect`)) {
    document.querySelector(`#id-${targetId} .reconnect`).style.display =
      "block";
  }
};

const createReconnectPeerDom = (targetId) => {
  if (document.querySelector(`#id-${targetId} .local-disconnect`)) {
    document.querySelector(`#id-${targetId} .local-disconnect`).style.display =
      "none";
  }
  if (document.querySelector(`#id-${targetId} .stop`)) {
    document.querySelector(`#id-${targetId} .stop`).style.display = "block";
  }
  if (document.querySelector(`#id-${targetId} .reconnect`)) {
    document.querySelector(`#id-${targetId} .reconnect`).style.display = "none";
  }
};

const destroyRemoteVideoDom = (targetId) => {
  document.querySelector(`#id-${targetId} video`).srcObject = null;
  document.querySelector(`#id-${targetId}`).remove();
};

const byeRemoteVideoDom = (targetId) => {
  document.querySelector(`#id-${targetId} video`).srcObject = null;
  document.querySelector(`#id-${targetId}`).remove();
};
