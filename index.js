window.onload = (event) => {
  var editButton = document.getElementById("editButton");
  editButton.onclick = sendToEditor;
  var presentButton = document.getElementById("presentButton");
  presentButton.onclick = sendToPresenter;
}

function sendToEditor() {
  var room = document.getElementById("room").value;
  window.location.href = "./edit.html?room=" + room;
}

function sendToPresenter() {
  var room = document.getElementById("room").value;
  window.location.href = "./present.html?room=" + room;
}
