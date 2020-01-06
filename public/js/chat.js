const socket = io();

// Elements
const $messageForm = document.querySelector("#message-form")
const $messageFormInput = $messageForm.querySelector("input")
const $messageFormButton = $messageForm.querySelector("button")
const $locationButton = document.querySelector("#send-location")
const $messages = document.querySelector("#messages");

// templates

const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationTemplate = document.querySelector("#location-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

const autoScroll = () => {
    // New message Elements
    const $newMessage = $messages.lastElementChild

    // Height of the new message
    const newMsgStyles = getComputedStyle($newMessage)
    const newMsgMargin = parseInt(newMsgStyles.marginBottom)
    const newMsgHeight = $newMessage.offsetHeight + newMsgMargin

    // visable Height
    const visableHeight = $messages.offsetHeight

    // Height of messages container
    const containerHeight = $messages.scrollHeight

    //How far have I scrolled
    const scrollOffset = $messages.scrollTop + visableHeight

    if (containerHeight - newMsgHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight
    }
}

// options
const { username, room } = Qs.parse(location.search, { ignoreQueryPrefix: true})
socket.on("message", (msg) => {
    console.log(msg);
    const html = Mustache.render(messageTemplate, {
        username: msg.username,
        message: msg.text,
        createdAt: moment(msg.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html)
    autoScroll();
})

socket.on("locationMessage", (msg) => {
    const html = Mustache.render(locationTemplate, {
        username: msg.username,
        location: msg.location,
        createdAt: moment(msg.createdAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html)
    console.log(msg)
    autoScroll();
})

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html
})

$messageForm.addEventListener("submit", (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute("disabled", "disabled")
    let msg = e.target.messageChat.value
    socket.emit("sendMessage", msg, (err) => {
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();
        if (err) {
                return console.log(err)
        }
        console.log("Message Delivered")
    })
})

$locationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not support by your browser")
    }
    $locationButton.setAttribute("disabled", "disabled")
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {
            longitude: position.coords.longitude,
            latitude: position.coords.latitude
        }, () => {
                $locationButton.removeAttribute("disabled")
                console.log("Location Shared!");
        })
    })
})

socket.emit("join", { username, room }, (error) => {
    if (error) {
        alert(error)
        location.href = "/"
    }
})
