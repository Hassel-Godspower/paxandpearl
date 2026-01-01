const ADMIN = { user: "admin", pass: "1234" };

function login() {
  if (
    user.value === ADMIN.user &&
    pass.value === ADMIN.pass
  ) {
    localStorage.setItem("admin", "true");
    window.location.href = "dashboard.html";
  } else {
    alert("Invalid credentials");
  }
}
