const form = document.getElementById("formLogin");
    const msgErro = document.getElementById("msgErro");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const formData = new FormData(form);
      const data = new URLSearchParams(formData);

      try {
        const res = await fetch("/login", {
          method: "POST",
          body: data,
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          }
        });

        if (res.redirected) {
          // Login ok, redirecionou para o painel
          window.location.href = res.url;
        } else {
          const text = await res.text();
          msgErro.style.display = "block";
          msgErro.textContent = text || "Erro no login";
        }
      } catch (error) {
        msgErro.style.display = "block";
        msgErro.textContent = "Erro ao tentar logar. Tente novamente.";
      }
    });