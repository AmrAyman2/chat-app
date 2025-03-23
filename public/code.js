(function(){
    const app = document.querySelector(".app");
    const socket = io();
    
    let uname;

    app.querySelector("#join-user").addEventListener("click", function(){
        let username = app.querySelector(".join-screen #username").value;
        if(username.length == 0){
            return;
        }
        socket.emit("join-room", username);
        uname = username;
        app.querySelector(".join-screen").classList.remove("active");
        app.querySelector(".chat-screen").classList.add("active");
    });

    app.querySelector(".chat-screen #send-message").addEventListener("click", function(){
        let message = app.querySelector(".chat-screen #message-input").value;
        if(message.length == 0){
            return;
        }
        renderMessage("my",{
            username:uname,
            text: message
        });
        socket.emit("chat",{
            username:uname,
            text: message
        });
        app.querySelector(".chat-screen #message-input").value = "";

    })

    app.querySelector(".chat-screen #exit-chat").addEventListener("click", function(){
        socket.emit("exit",uname);
        window.location.href = window.location.href;
    }
)



    function renderMessage(type, message) {
        let messagecontainer = app.querySelector(".chat-screen .messages");
        if(type == "my"){
            let messageElement = document.createElement("div");
            messageElement.setAttribute("class","message my-message");
            messageElement.innerHTML = `<div>
            <div class="name">You</div>
            <div class="text">${message.text}</div>
            </div>`;
            messagecontainer.appendChild(messageElement);
        }  else if(type=="other"){
            let messageElement = document.createElement("div");
            messageElement.setAttribute("class","message other-message");
            messageElement.innerHTML = `<div>
            <div class="name">${message.username}</div>
            <div class="text">${message.text}</div>
            </div>`;
            messagecontainer.appendChild(messageElement);
        } else if(type=="update"){
            let messageElement = document.createElement("div");
            messageElement.setAttribute("class","update");
            messageElement.innerText = message;
            messagecontainer.appendChild(messageElement);
        }
        messagecontainer.scrollTop = messagecontainer.scrollHeight - messagecontainer.clientHeight;
    }
}

)