 async function signUp() {
  const email = document.getElementById("email").value;
  const phone = document.getElementById("phone").value;
  const password = document.getElementById("password").value;
  const securityQuestion = document.getElementById("security_question").value;
  const securityAnswer = document.getElementById("security_answer").value;

  try {
    const res = await fetch("/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: email,
        phone_number: phone || null,
        password: password,
        security_question: securityQuestion,
        security_answer: securityAnswer,
      }),
    });

    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Invalid JSON response");
    }

    if (res.status === 201) {
      document.querySelector(".signup-suc").style.display = "flex";
      document.querySelector(".signup-fail").style.display = "none";

      setTimeout(() => {
        window.location.href = "/login";
      }, 2000);

    } else {
      document.querySelector(".signup-fail").textContent =
        data.error || "Signup failed";
      document.querySelector(".signup-fail").style.display = "flex";
      document.querySelector(".signup-suc").style.display = "none";
    }

  } catch (error) {
    console.error("Signup error:", error);
    alert("Network Error (check backend logs)");
  }
}