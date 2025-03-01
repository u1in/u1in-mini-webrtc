const Websocket = require("ws");

// 简单生成唯一id用于标记
const generateUniqueId = () => {
  return Math.random().toString(36).substr(2, 9);
};

// 创建ws服务器
const wss = new Websocket.Server({ host: "0.0.0.0", port: 3001 });

// 创建连接池
const clients = new Map();

// 开启ws监听
wss.on("connection", (ws) => {
  // 收到连接请求
  // 生成唯一id
  const id = generateUniqueId();
  // 加入连接池
  clients.set(id, ws);
  // 简单日志
  console.log(`Client ${id} connected`);

  // 主要处理函数
  ws.on("message", (message) => {
    const data = JSON.parse(message);
    handleMessage(id, data);
  });

  // 关闭函数
  ws.on("close", () => {
    clients.delete(id);
    console.log(`Client ${id} disconnected`);
  });

  // 发送欢迎信息附带id
  ws.send(JSON.stringify({ type: "welcome", id }));
});

// 对offer、answer、candidate、stop、bye等消息进行处理
function handleMessage(senderId, data) {
  const { type, targetId, payload } = data;

  switch (type) {
    case "offer":
    case "answer":
    case "candidate":
    case "stop":
    case "bye":
      if (clients.has(targetId)) {
        clients.get(targetId).send(
          JSON.stringify({
            type,
            senderId,
            payload,
          })
        );
      }
      break;
  }
}
