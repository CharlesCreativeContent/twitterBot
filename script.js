let button = document.querySelector("button")
function submiter(){
    
    document.querySelectorAll("a").forEach(element=>{
    let url = element.href
    let human = element.nextElementSibling.nextElementSibling.children[0].checked;
    let followerError = element.nextElementSibling.nextElementSibling.nextElementSibling.children[0].checked;
    console.log(url);
        axios.post("/remove",{
        url,
        human: `${human}`,
        followerError: `${followerError}`,
        }).then(response=>{
        console.log(response)
        })
    })
    
    alert("users submitted")
    window.location.reload()
}

let base = window.location.href.split('/').reverse()[0]
  
    axios
    .get("/info/"+base)
    .then((response) => {
          console.log("get - code")
          response.data.forEach(user=>{
              document.querySelector("#twitterCards").innerHTML += `<div class="card">
  
   <img class="card-img-top" src="${user.img}" alt="Card image cap">
  <div class="card-body">
    <a target="_blank" href="${user.url}"><h5 class="card-title">${user.name}</h5></a>
    <p class="card-text">Followers: ${user.followers}</p>


<div class="form-switch">
<input class="form-check-input" id="flexSwitchCheckChecked" name="human" type="checkbox" checked>
<label for="human">Human?</label>
  </div>
<div class="form-switch">
<input class="form-check-input" id="flexSwitchCheckChecked" name="follwerError" type="checkbox">
<label for="follwerError">Too Many or Not Enough Followers?</label>
  </div>
  </div>
</div>`;
              
          })
      });

    console.log("Start Tests")