const ADMIN = {
  user: "admin",
  pass: "1234"
};

function login() {
  const username = document.getElementById("user").value;
  const password = document.getElementById("pass").value;

  if (username === ADMIN.user && password === ADMIN.pass) {
    localStorage.setItem("adminSession", "true");
    window.location.href = "admin-dashboard.html";
  } else {
    alert("Invalid credentials");
  }
}

function logoutAdmin() {
  localStorage.removeItem("adminSession");
  window.location.href = "admin.html";
}
