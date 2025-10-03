let title = document.getElementById("title");
let price = document.getElementById("price");
let taxes = document.getElementById("taxes");
let ads = document.getElementById("ads");
let discount = document.getElementById("discount");
let total = document.getElementById("total");
let count = document.getElementById("count");
let category = document.getElementById("category");
let submit = document.getElementById("submit");
let tbody = document.getElementById("tbody");
let searchCategoryBtn = document.getElementById("searchCategory");
let mode = "create";
let tmp;
let searchMode = "title";

onload = () => {
  if (dataPro.length > 0) {
    showData();
  }
  scroll({
    top: 0,
    behavior: "smooth",
  });
  clearInputs();
};

//get total
function getTotal() {
  if (price.value != "") {
    let result = +price.value + +taxes.value + +ads.value - +discount.value;
    total.innerHTML = result;
    total.style.background = "green";
  } else {
    total.innerHTML = "";

    total.style.background = "#db1010";
  }
}

//create product
let dataPro = JSON.parse(localStorage.getItem("products_data")) || [];
function createProduct() {
  let newPro = {
    title: title.value,
    price: price.value,
    taxes: taxes.value,
    ads: ads.value,
    discount: discount.value,
    total: total.innerHTML,
    count: count.value,
    category: category.value,
  };
  if (mode == "create") {
    for (let i = 0; i < newPro.count; i++) {
      dataPro.push(newPro);
    }
  }
  if (mode == "update") {
    dataPro[tmp] = newPro;
    mode = "create";
    submit.innerText = "create";
    count.style.display = "block";
  }
  localStorage.setItem("products_data", JSON.stringify(dataPro));
  clearInputs();
  showData();
}

submit.onclick = () => {
  createProduct();
};

//clear inputs
function clearInputs() {
  title.value = "";
  price.value = "";
  taxes.value = "";
  ads.value = "";
  discount.value = "";
  total.innerHTML = "";
  total.style.background = "#db1010";
  count.value = "";
  category.value = "";
  document.getElementById("search").value = "";
  submit.classList.add("disabled");
}
//check inputs data

function canCreate() {
  return (
    title.value != "" &&
    price.value != "" &&
    count.value != "" &&
    count.value < 100 &&
    count.value > 0 &&
    category.value != ""
  );
}

function handleSubmitButtonStatus() {
  const isCreateBtnDisabled = canCreate();
  console.log(isCreateBtnDisabled);
  isCreateBtnDisabled == false
    ? submit.classList.add("dabled")
    : submit.classList.remove("disabled");
}
// main inputs
title.onkeyup = () => {
  getTotal();
  handleSubmitButtonStatus();
};

price.onkeyup = () => {
  getTotal();
  handleSubmitButtonStatus();
};

count.onkeyup = () => {
  getTotal();
  handleSubmitButtonStatus();
};

category.onkeyup = () => {
  getTotal();
  handleSubmitButtonStatus();
};
//read
function showData() {
  tbody.innerHTML = "";
  let table;
  for (let i = 0; i < dataPro.length; i++) {
    table = `
     <tr>
        <td>${i}</td>
        <td>${dataPro[i].title || "-"}</td>
        <td>${dataPro[i].price}</td>
        <td>${dataPro[i].taxes || "-"}</td>
        <td>${dataPro[i].ads || "-"}</td>
        <td>${dataPro[i].discount || "-"}</td>
        <td>${dataPro[i].total || "-"}</td>
        <td>${dataPro[i].category}</td>
        <td><button id="update" onclick="updateData(${i})">update</button></td>
        <td><button id="delete" onclick="deleteData(${i})">delete</button></td>
    </tr>
    `;
    tbody.innerHTML += table;
  }
  let deleteBtn = document.getElementById("deleteAll");
  if (dataPro.length > 0) {
    deleteBtn.innerHTML = `
    <button onclick="deleteAll()">Delete All(${dataPro.length})</button
    `;
    deleteBtn.style.margin = "4px 0";
  } else {
    deleteBtn.innerHTML = "";
  }
}

function deleteData(index) {
  dataPro.splice(index, 1);
  localStorage.setItem("products_data", JSON.stringify(dataPro));
  showData();
}

function deleteAll() {
  dataPro = [];
  localStorage.clear();
  showData();
}

function updateData(index) {
  tmp = index;
  mode = "update";
  title.value = dataPro[index].title;
  price.value = dataPro[index].price;
  taxes.value = dataPro[index].taxes || "";
  ads.value = dataPro[index].ads || "";
  discount.value = dataPro[index].discount || "";
  count.style.display = "none";
  total.innerHTML = dataPro[index].total;
  category.value = dataPro[index].category;
  submit.innerText = "update";
  submit.classList.remove("disabled");
  getTotal();
  scroll({
    top: 0,
    behavior: "smooth",
  });
}

function changeSearchMode(mode) {
  searchMode = mode;
  let seaerch = document.getElementById("search");
  search.value = "";
  search.placeholder = `Search BY ${searchMode}`;

  showData();
}

function pushData(data, i) {
  table = `
     <tr>
        <td>${i}</td>
        <td>${data.title || "-"}</td>
        <td>${data.price}</td>
        <td>${data.taxes || "-"}</td>
        <td>${data.ads || "-"}</td>
        <td>${data.discount || "-"}</td>
        <td>${data.total || "-"}</td>
        <td>${data.category}</td>
        <td><button id="update" onclick="updateData(${i})">update</button></td>
        <td><button id="delete" onclick="deleteData(${i})">delete</button></td>
    </tr>
    `;
  return table;
}

function searchData(searchTerm) {
  let table = "";
  tbody.innerHTML = "";

  for (let i = 0; i < dataPro.length; i++) {
    if (searchMode == "title") {
      if (dataPro[i].title.toLowerCase().includes(searchTerm.toLowerCase())) {
        tbody.innerHTML += pushData(dataPro[i], i);
      }
    } else {
      if (
        dataPro[i].category.toLowerCase().includes(searchTerm.toLowerCase())
      ) {
        tbody.innerHTML += pushData(dataPro[i], i);
      }
    }
  }
}
