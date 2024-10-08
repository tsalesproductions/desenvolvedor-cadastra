const serverUrl = "http://localhost:5000";
import { Product } from "./Product";

// Format price
function priceFormat(price : number) {
  return price.toLocaleString("pt-BR", { minimumFractionDigits: 2 , style: 'currency', currency: 'BRL' })
}

//SearchParams
function searchParams(){
  const queryString = window.location.search;
  const urlParams = new URLSearchParams(queryString);
  return urlParams;
}

// Function to fetch products from API
async function getProducts(): Promise<Product[]> {
  const response = await fetch(`${serverUrl}/products`);
  const products = await response.json();
  return products;
}

// Retrieve produts from a simulated "catalog"
async function categoryData(){
  let products = await getProducts();

  //Get search params
  const search = searchParams();

  //Filter by color
  if(search.has("color")){
    products = products.filter((product: Product) => product.color === search.get("color"));
  }

  //Filter by size
  if(search.has("size")){
    products = products.filter((product: Product) => product.size.includes(search.get("size")) );
  }

  //Filter by price
  if(search.has("price")){
    const price = search.get("price");
    const priceRange = price.split("-");

    products = products.filter((product: Product) => {
      if(priceRange.length === 2){
        return product.price >= parseInt(priceRange[0]) && product.price <= parseInt(priceRange[1]);
      }else{
        return product.price >= parseInt(priceRange[0]);
      }
    });
  }

  //Order by
  if(search.has("order")){
    const order = search.get("order");
    switch(order){
      case "ReleaseDESC":
        products = products.sort((a: Product, b: Product) => new Date(b.date).getTime() - new Date(a.date).getTime());
      break;
      case "priceASC":
        products = products.sort((a: Product, b: Product) => a.price - b.price);
      break;
      case "priceDESC":
        products = products.sort((a: Product, b: Product) => b.price - a.price);
      break;
    }
  }

  //limit per page, and create object per page (dinaymic pagination)
  const qtdPerPage = 9;
  const totalPages = Math.ceil(products.length / qtdPerPage);
  const page = parseInt(search.get("page")) || 1;
  const start = (page - 1) * qtdPerPage;
  const end = start + qtdPerPage;
  products = products.slice(start, end);

  if(page >= totalPages){
    document.querySelector(".view-more")?.remove();
  }

  return {
    products,
    page:{
      current: page,
      total: totalPages
    }
  }
}

// Function to update the URL hash
function updateParamsHash(type: string, value?:string, reload:boolean = true){
  const actualURL = window.location.origin + window.location.pathname; 
  const newParams = new URLSearchParams(window.location.search);

  if(value){
    newParams.set(type, value);

    if(type !== "page"){
      newParams.delete("page");
    }
  }else{
    newParams.delete(type);
  }

  const newUrl = `${actualURL}?${newParams.toString()}`;
  history.pushState(null, null, newUrl);

  if(reload){
    window.location.reload();
  }
}

// Function to apply events and update the URL hash when a filter is selected
function applyFilters(){
  const colorSize = document.querySelectorAll('.product-filters input[type=checkbox]');
  const priceFilter = document.querySelectorAll('.product-filters ul li');
  const orderFilter = document.querySelectorAll('main .order select');
  //Size and color filters
  colorSize.forEach((item: HTMLInputElement) => {
    item.addEventListener('change', ({target}) => {
      const input = target as HTMLInputElement;
      const typeFilter = (target as Element).closest(".filters")?.getAttribute("data-type");

      if(input.checked){
        input.closest(".filters").querySelectorAll('.product-filters input[type=checkbox]').forEach((item: HTMLInputElement) => item.checked = false);
        input.checked = true;
        return updateParamsHash(typeFilter, input.value);
      }

      updateParamsHash(typeFilter, null);
    })
  });

  //Price filter
  priceFilter.forEach((item: HTMLLIElement) => {
    item.addEventListener('click', ({target}) => {
      item.closest(".filters").querySelectorAll('.product-filters li').forEach((item: HTMLLIElement) => item.classList.remove("active"));
      const typeFilter = (target as Element).closest(".filters")?.getAttribute("data-type");
      item.classList.add("active");
      updateParamsHash(typeFilter, (target as HTMLElement).textContent);

    })
  })

  //Order filter
  orderFilter.forEach((item: HTMLSelectElement) => {
    item.addEventListener('change', ({target}) => {
      const typeFilter = (target as Element).closest(".order")?.getAttribute("data-type");
      updateParamsHash(typeFilter, (target as HTMLSelectElement).value);
    })
  })

  //Set active filters
  setActiveFilters();

  //Set more colors
  moreColorsManager();

}

// Set active filters on page load/reload
function setActiveFilters(){
  const search = searchParams();
  const color = search.get("color");
  const size = search.get("size");
  const price = search.get("price");

  if(color){
    document.querySelector(`.filters[data-type="color"] input[value="${color}"]`)
    ?.setAttribute("checked", "checked");
  }

  if(price){
    document.querySelector(`.filters[data-type="price"] input[value="${price}"]`)
    ?.setAttribute("checked", "checked");
  }

  if(size){
    Array.from(document.querySelectorAll(`.filters[data-type="size"] li`))
    .find((item) => item.textContent === size)
    ?.classList.add("active");
  }

  const order = search.get("order");
  if(order){
    document.querySelector(`.order[data-type="order"] select`)
    .querySelector(`option[value="${order}"]`)
    .setAttribute("selected", "selected");
  }


  //paginate (Dinamic page on click view more btn)
  const viewMore = document.querySelector(".view-more");
  if(viewMore){
    viewMore.classList.remove("hidden");
    const nextPage = parseInt(viewMore.getAttribute("data-page")) + 1;
    viewMore.setAttribute("data-page", nextPage.toString());

  }
}

//Render product card dynamic
function renderProduct(products : Product[]){
  const targetProducts = document.querySelector(".product-list .products");
  if(targetProducts){
    products.forEach((product) => {
      targetProducts.insertAdjacentHTML("beforeend", `
        <div class="card" data-id="${product.id}">
          <img src="${product.image}" alt="${product.name}">
          <h2>${product.name}</h2>
          <strong>${priceFormat(product.price)}</strong>
          <span>até ${product.parcelamento[0]}x de ${priceFormat(product.parcelamento[1])}</span>
          <button>Comprar</button
        </div>
      `);
    })

    addToCart();
  }
}

//More colors manager/toggle
function moreColorsManager(){
    const moreColors = document.querySelector('.filters[data-type="color"]');
    
    if(moreColors){
      const items = moreColors.querySelectorAll('.item');
    
      items.forEach((item, index) => {
        if(index > 4){
          item.classList.add("hidden");
        }
      })

      moreColors.insertAdjacentHTML("beforeend", `<button class="more-colors">Ver todas as cores <svg width="9" height="7" viewBox="0 0 9 7" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M1 1L4.5 6L8 1.00519" stroke="#666666" stroke-linecap="round"/> </svg></button>`);

      moreColors.querySelector(".more-colors")?.addEventListener("click", () => {
        items.forEach((item) => item.classList.remove("hidden"));
        moreColors.querySelector(".more-colors")?.remove();
      })
    }

    
}

//Update view more btn
function updateViewMore(currentPage: number){
  const viewMore = document.querySelector(".view-more");
  if(viewMore){
    viewMore.setAttribute("data-page", currentPage.toString());
  }
}

//View more products on click
async function handleViewMore(){
  const viewMore = document.querySelector(".view-more");
  if(viewMore){
    viewMore.addEventListener("click", async () => {
      const nextPage = parseInt(viewMore.getAttribute("data-page")) +1;
      updateParamsHash("page", nextPage.toString(), false);
      const {products, page} = await categoryData();
      renderProduct(products);
      updateViewMore(page.current);
      
    });
  }
}

//Filter mobile
function filterMobile(){
  const wWidth = window.innerWidth;

  if(wWidth <= 768){
    const title = document.querySelector("main .container.top h1");
    if(title){
      title.insertAdjacentHTML("afterend", `
        <div class="filters-mobile">
          <button data-type="filter">Filtrar</button>
          <button data-type="order">Ordenar</button>
        </div>
      `)
    }

    const customModal = document.querySelector(".custom-modal");
    const ctaFilter = document.querySelectorAll(".filters-mobile button");

    ctaFilter.forEach((item) => {
      item.addEventListener("click", () => {
        const type = item.getAttribute("data-type");
        if(customModal){
          customModal.remove();
        }
        customFilterModal(type);
      })
    })
    
  }
}

//Filter modal
function customFilterModal(type: string){
  const modal = document.createElement("div");
  modal.classList.add("custom-modal");
  modal.insertAdjacentHTML("beforeend", `
    <div class="modal-header">
      ${type == "order" ? `Ordenar` : `Filtrar`}
      <button class="close-modal"><svg width="19" height="20" viewBox="0 0 19 20" fill="none" xmlns="http://www.w3.org/2000/svg"> <path d="M0.5 18.852L17.5547 1.00001" stroke="black"/> <line y1="-0.5" x2="25.2899" y2="-0.5" transform="matrix(0.711746 0.702437 -0.874311 0.485367 0 1.23547)" stroke="black"/> </svg></button>
    </div>
    <div class="modal-content"></div>  
  `)

  const content = modal.querySelector(".modal-content");
  const close = modal.querySelector(".close-modal");
  close.addEventListener("click", () => {
    modal.remove();
  })

  switch(type){
    case "filter":
      const filters = document.querySelector(".product-filters");
      if(filters){
        content.appendChild(filters
          // .cloneNode(true)
        );

        content.querySelectorAll("h3").forEach((item) => {
          item.addEventListener("click", () => {
            item.closest(".product-filter").classList.toggle("active");
          })
        })
      }
    break;
    case "order":
      content.innerHTML = `
        <ul class="order-filter">
          <li data-filter="ReleaseDESC">Mais recentes</li>
          <li data-filter="priceASC">Menor preço</li>
          <li data-filter="priceDESC">Maior preço</li>
        </ul>
      `;

      content.querySelectorAll("li").forEach((item) => {
        item.addEventListener("click", () => {
          updateParamsHash("order", item.getAttribute("data-filter"));
          modal.remove();
        });
      });
    break;
  }

  document.body.appendChild(modal);
}

//Update cart badge
function updateBadgeCart(cartItems: number){
  const cartQtd = document.querySelector("header .container .cart .qtd");
  if(cartQtd){
    cartQtd.textContent = cartItems.toString();
  }

  if(cartItems === 0){
    cartQtd.parentElement.classList.add("without-items");
  }else{
    cartQtd.parentElement.classList.remove("without-items");
  }
}

//Add to cart
function addToCart(){
  const cart = localStorage.getItem("cart") || "[]";
  const cartItems = JSON.parse(cart);
  const cartBtns = document.querySelectorAll(".card:not(.trigged) button");

  cartBtns.forEach((item) => {
    item.addEventListener("click", ({target}) => {
      item.classList.add("trigged");
      const card = (target as Element).closest(".card");
      const id = card?.getAttribute("data-id");

      if(id){
        const exists = cartItems.find((product: Product)=>product.id == id);
        if(exists){
          //Update qtd
          const index = cartItems.findIndex((product: Product) => product.id == id);
          cartItems[index].quantity += 1;
        }else{
          //Add new product
          const product = {
            id: id,
            quantity: 1
          }
          cartItems.push(product);
        }
        
        localStorage.setItem("cart", JSON.stringify(cartItems));
        renderCartItems();
        updateBadgeCart(cartItems.length);
        alert("Produto adicionado ao carrinho!");
      }
    })
  })

  updateBadgeCart(cartItems.length);
}

//Render cart items
async function renderCartItems(){
  const products = await getProducts(); 

  const cart = localStorage.getItem("cart") || "[]";
  const cartItems = JSON.parse(cart);
  const target = document.querySelector("header .cart .minicart ul");
  
  target.closest(".cart:not(.trigged)")?.addEventListener("click", ({target}) => {
    (target as Element).closest(".cart").classList.toggle("active");
  })

  target.closest(".cart:not(.trigged)")?.classList.add("trigged")
  
  if(target){
    target.innerHTML = "";
    const totals = target.parentElement.querySelector(".totals");
    let subtotal = 0;

    cartItems.forEach((item: Product) => {
      const product = products.find((product: Product) => product.id == item.id);
      subtotal += product.price * item.quantity;
      target.insertAdjacentHTML("beforeend", `
        <li>
          <img src="${product.image}" alt="${product.name}">
          <div>
            <h3>${product.name}</h3>
            <strong>${priceFormat(product.price)}</strong>
            <span>Qtd: ${item.quantity}</span>
          </div>
          <button data-id="${item.id}"><svg width="25" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 50 50" enable-background="new 0 0 50 50" xml:space="preserve"> <path fill="#231F20" d="M10.289,14.211h3.102l1.444,25.439c0.029,0.529,0.468,0.943,0.998,0.943h18.933 c0.53,0,0.969-0.415,0.998-0.944l1.421-25.438h3.104c0.553,0,1-0.448,1-1s-0.447-1-1-1h-3.741c-0.055,0-0.103,0.023-0.156,0.031 c-0.052-0.008-0.1-0.031-0.153-0.031h-5.246V9.594c0-0.552-0.447-1-1-1h-9.409c-0.553,0-1,0.448-1,1v2.617h-5.248 c-0.046,0-0.087,0.021-0.132,0.027c-0.046-0.007-0.087-0.027-0.135-0.027h-3.779c-0.553,0-1,0.448-1,1S9.736,14.211,10.289,14.211z M21.584,10.594h7.409v1.617h-7.409V10.594z M35.182,14.211L33.82,38.594H16.778l-1.384-24.383H35.182z"/> <path fill="#231F20" d="M20.337,36.719c0.02,0,0.038,0,0.058-0.001c0.552-0.031,0.973-0.504,0.941-1.055l-1.052-18.535 c-0.031-0.552-0.517-0.967-1.055-0.942c-0.552,0.031-0.973,0.504-0.941,1.055l1.052,18.535 C19.37,36.308,19.811,36.719,20.337,36.719z"/> <path fill="#231F20" d="M30.147,36.718c0.02,0.001,0.038,0.001,0.058,0.001c0.526,0,0.967-0.411,0.997-0.943l1.052-18.535 c0.031-0.551-0.39-1.024-0.941-1.055c-0.543-0.023-1.023,0.39-1.055,0.942l-1.052,18.535C29.175,36.214,29.596,36.687,30.147,36.718 z"/> <path fill="#231F20" d="M25.289,36.719c0.553,0,1-0.448,1-1V17.184c0-0.552-0.447-1-1-1s-1,0.448-1,1v18.535 C24.289,36.271,24.736,36.719,25.289,36.719z"/> </svg></button>
        </li>
      `);
    })

    target.querySelectorAll("button").forEach((item) => {
      item.addEventListener("click", ({target}) => {
        const id = (target as HTMLElement).closest("button").getAttribute("data-id");
        if(id){
          const index = cartItems.findIndex((product: Product) => product.id === id);

          cartItems.splice(index, 1);
          localStorage.setItem("cart", JSON.stringify(cartItems));
          renderCartItems();
          updateBadgeCart(cartItems.length);

        }
      })
    });

    totals.innerHTML = `Subtotal: <strong>${priceFormat(subtotal)}</strong>`;
  }
}

async function main(){
  applyFilters();

  const {products, page} = await categoryData();
  renderProduct(products);
  updateViewMore(page.current);
  handleViewMore();
  filterMobile();
  renderCartItems();
}

document.addEventListener("DOMContentLoaded", main);
