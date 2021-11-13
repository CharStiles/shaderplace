window.onload = (event) => {
  var goButton = document.getElementById("goButton");
  goButton.onclick = sendToEditor;
}

function sendToEditor() {
  var room = document.getElementById("room").value;
  window.location.href = "./edit.html?room=" + room;
}
