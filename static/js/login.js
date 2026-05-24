
    async function login() {
      const email = document.getElementById("email").value;
      const password = document.getElementById("password").value;

      try {
        const res = await fetch("/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: email,
            password: password,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          document.querySelector(".login-fail").style.display = "flex";
          document.querySelector(".login-suc").style.display = "none";
        }

        if (data.access_token) {
          localStorage.setItem("access_token", data.access_token);
          console.log(data.access_token);
          document.querySelector(".login-suc").style.display = "flex";
          document.querySelector(".login-fail").style.display = "none";
          setTimeout(() => {
            window.location.href = "/";
          }, 2000);
        }
      } catch (err) {
        console.log(err);
        alert("Network Error.");
      }
    }
  