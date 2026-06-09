
let medicines = JSON.parse(localStorage.getItem("medicines")) || [];
let customers = JSON.parse(localStorage.getItem("customers")) || [];
let suppliers = JSON.parse(localStorage.getItem("suppliers")) || [];
let invoices = JSON.parse(localStorage.getItem("invoices")) || [];
let cart = [];
let currentSearchTab = 'med';

function saveData() {
    localStorage.setItem("medicines", JSON.stringify(medicines));
    localStorage.setItem("customers", JSON.stringify(customers));
    localStorage.setItem("suppliers", JSON.stringify(suppliers));
    localStorage.setItem("invoices", JSON.stringify(invoices));
}

// ==========================================================================
// 2. نظام تسجيل الدخول والتحكم بالواجهات
// ==========================================================================
function login() {
    let u = document.getElementById("username").value.trim();
    let p = document.getElementById("password").value.trim();
    
    if (u === "morad" && p === "123") {
        document.getElementById("loginPage").style.display = "none";
        document.getElementById("system").style.display = "flex";
        initSystem();
    } else { 
        alert("عذراً، اسم المستخدم أو كلمة المرور خاطئة!"); 
    }
}

function logout() {
    document.getElementById("system").style.display = "none";
    document.getElementById("loginPage").style.display = "flex";
}

function initSystem() {
    loadDashboard();
    renderMedicines();
    renderCustomers();
    renderSuppliers();
    renderInvoices();
    updateSalesCustomerDropdown();
}

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(p => p.style.display = "none");
    document.getElementById(pageId).style.display = "block";
    if(pageId === 'searchPage') globalSearch();
}

// ==========================================================================
// 3. لوحة التحكم وحساب صافي الأرباح الحقيقية (سعر البيع - سعر الشراء)
// ==========================================================================
function loadDashboard() {
    let totalSales = 0;
    let totalProfit = 0;
    
    invoices.forEach(inv => {
        totalSales += Number(inv.total) || 0;
        totalProfit += Number(inv.profit) || 0; 
    });
    
    document.getElementById("sales").innerText = totalSales.toFixed(2) + " ريال";
    document.getElementById("profit").innerText = totalProfit.toFixed(2) + " ريال";
    document.getElementById("medCount").innerText = medicines.length;
    document.getElementById("customerCount").innerText = customers.length;

    // تنبيهات المخزون المنخفض
    let stockBox = document.getElementById("stockAlerts");
    if (stockBox) {
        stockBox.innerHTML = "";
        let lowStockMeds = medicines.filter(m => m.stock < 5);
        if(lowStockMeds.length === 0) stockBox.innerHTML = "<p style='color:green; font-size:14px;'>جميع الأصناف متوفرة وبكميات آمنة ✅</p>";
        lowStockMeds.forEach(m => {
            stockBox.innerHTML += `<div class="alert-item"><span>${m.name}</span> <b>المتبقي: ${m.stock} حبات</b></div>`;
        });
    }

    // تنبيهات تاريخ انتهاء الصلاحية
    let expBox = document.getElementById("expiryAlerts");
    if (expBox) {
        expBox.innerHTML = "";
        let today = new Date();
        let expiryCount = 0;

        medicines.forEach(m => {
            if(!m.expiry) return;
            let expDate = new Date(m.expiry);
            let timeDiff = expDate - today;
            let daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 0) {
                expiryCount++;
                expBox.innerHTML += `<div class="alert-item"><span>${m.name}</span> <b style="color:red;">منتهي الصلاحية ❌</b></div>`;
            } else if (daysDiff <= 30) {
                expiryCount++;
                expBox.innerHTML += `<div class="alert-item warning-item"><span>${m.name}</span> <b>ينتهي خلال ${daysDiff} يوم ⏳</b></div>`;
            }
        });
        if(expiryCount === 0) expBox.innerHTML = "<p style='color:green; font-size:14px;'>جميع الأدوية بصلاحية ممتازة وآمنة 👍</p>";
    }
}

// ==========================================================================
// 4. إدارة الأدوية والصور
// ==========================================================================
function addMedicine() {
    let name = document.getElementById("medName").value.trim();
    let cost = Number(document.getElementById("medCost").value);
    let price = Number(document.getElementById("medPrice").value);
    let stock = Number(document.getElementById("medStock").value);
    let expiry = document.getElementById("medExpiry").value;
    let image = document.getElementById("medImage").value.trim();

    if (name === "" || price <= 0 || cost <= 0 || stock < 0) {
        alert("الرجاء إدخال بيانات صحيحة! تأكد من كتابة الاسم وتحديد أسعار موجبة للتكلفة والبيع.");
        return; 
    }

    if(image === "") {
        image = "images/default-med.png";
    }

    let existingMed = medicines.find(m => m.name.toLowerCase() === name.toLowerCase());

    if (existingMed) {
        existingMed.stock += stock;
        existingMed.cost = cost;
        existingMed.price = price; 
        existingMed.image = image;
        if(expiry) existingMed.expiry = expiry; 
        alert(`الدواء مسجل مسبقاً! تم دمج الكمية وتحديث البيانات.`);
    } else {
        medicines.push({ id: Date.now(), name, cost, price, stock, expiry, image });
        alert("تم إضافة الصنف الجديد بنجاح ✅");
    }

    saveData(); 
    clearInputs(['medName', 'medCost', 'medPrice', 'medStock', 'medExpiry', 'medImage']);
    renderMedicines(); 
    loadDashboard();
}

function renderMedicines() {
    let container = document.getElementById("medList");
    let salesContainer = document.getElementById("salesMedicines");
    if (!container || !salesContainer) return;
    
    container.innerHTML = ""; 
    salesContainer.innerHTML = "";

    medicines.forEach(med => {
        let medImgSrc = med.image || "images/default-med.png";

        container.innerHTML += `
            <div class="data-card">
                <img src="${medImgSrc}" alt="${med.name}" class="med-card-img">
                <h3>💊 ${med.name}</h3>
                <p>💰 سعر البيع: ${med.price} ريال</p>
                <p>📉 سعر الشراء: ${med.cost} ريال</p>
                <p>📦 المخزون المتاح: ${med.stock}</p>
                <p>📅 الصلاحية: ${med.expiry || 'غير محدد'}</p>
                <div class="card-actions-row">
                    <button class="btn-edit" onclick="openEditModal(${med.id})">✏️ تعديل</button>
                    <button class="btn-delete" onclick="deleteMedicine(${med.id})">🗑️ حذف</button>
                </div>
            </div>`;
        
        salesContainer.innerHTML += `
            <div class="data-card" style="border-top: 4px solid #0f766e;">
                <img src="${medImgSrc}" alt="${med.name}" class="med-card-img">
                <h3>${med.name}</h3>
                <p>السعر: ${med.price} ريال</p>
                <p>المخزون: ${med.stock}</p>
                <button onclick="addToCart(${med.id})" style="width:100%; margin-top:10px;">🛒 إضافة للسلة</button>
            </div>`;
    });
}

function deleteMedicine(id) {
    if (confirm("هل أنت متأكد من رغبتك في حذف هذا الدواء نهائياً؟")) {
        medicines = medicines.filter(m => m.id !== id);
        saveData();
        renderMedicines();
        loadDashboard();
    }
}

function openEditModal(id) {
    let med = medicines.find(m => m.id === id);
    if (!med) return;

    document.getElementById("editMedId").value = med.id;
    document.getElementById("editMedName").value = med.name;
    document.getElementById("editMedCost").value = med.cost || 0;
    document.getElementById("editMedPrice").value = med.price;
    document.getElementById("editMedStock").value = med.stock;
    document.getElementById("editMedExpiry").value = med.expiry || "";
    document.getElementById("editMedImage").value = med.image || "";

    document.getElementById("editMedicineModal").style.display = "flex";
}

function saveMedicineEdit() {
    let id = Number(document.getElementById("editMedId").value);
    let med = medicines.find(m => m.id === id);
    
    if (med) {
        let name = document.getElementById("editMedName").value.trim();
        let cost = Number(document.getElementById("editMedCost").value);
        let price = Number(document.getElementById("editMedPrice").value);
        let stock = Number(document.getElementById("editMedStock").value);
        let expiry = document.getElementById("editMedExpiry").value;
        let image = document.getElementById("editMedImage").value.trim();

        if(name === "" || price <= 0 || cost <= 0 || stock < 0) { 
            alert("يرجى إدخال قيم صحيحة قبل الحفظ!"); 
            return; 
        }

        med.name = name;
        med.cost = cost;
        med.price = price;
        med.stock = stock;
        med.expiry = expiry;
        med.image = image || "images/default-med.png";

        saveData();
        closeEditModal();
        renderMedicines();
        loadDashboard();
    }
}

function closeEditModal() {
    document.getElementById("editMedicineModal").style.display = "none";
}

// ==========================================================================
// 5. نظام سلة المشتريات
// ==========================================================================
function addToCart(id) {
    let med = medicines.find(m => m.id === id);
    if (!med) return;
    if (med.stock <= 0) { alert("عذراً، هذا الدواء نفد من المخزن حالياً!"); return; }

    let cartItem = cart.find(item => item.id === id);
    if (cartItem) {
        if (cartItem.quantity >= med.stock) { alert("لا يمكن تجاوز الكمية المتاحة في المخزن!"); return; }
        cartItem.quantity++;
    } else {
        cart.push({ id: med.id, name: med.name, price: med.price, cost: med.cost, quantity: 1 });
    }
    renderCart();
}

function changeCartQty(id, delta) {
    let cartItem = cart.find(item => item.id === id);
    let med = medicines.find(m => m.id === id);
    if (!cartItem) return;

    if (delta > 0 && cartItem.quantity >= med.stock) { alert("أقصى كمية متوفرة في المخزن!"); return; }
    cartItem.quantity += delta;
    if (cartItem.quantity <= 0) cart = cart.filter(item => item.id !== id);
    renderCart();
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    renderCart();
}

function renderCart() {
    let box = document.getElementById("cart");
    if (!box) return;
    box.innerHTML = "";
    let total = 0;

    cart.forEach(item => {
        let subtotal = item.price * item.quantity;
        total += subtotal;
        box.innerHTML += `
            <div class="cart-item">
                <div>
                    <h4>${item.name}</h4>
                    <small>${item.price} ريال × ${item.quantity}</small>
                </div>
                <div class="cart-actions">
                    <button onclick="changeCartQty(${item.id}, 1)">+</button>
                    <button onclick="changeCartQty(${item.id}, -1)">-</button>
                    <button onclick="removeFromCart(${item.id})" class="btn-del">🗑️</button>
                </div>
            </div>`;
    });
    document.getElementById("cartTotal").innerText = `الإجمالي: ${total} ريال`;
}

// ==========================================================================
// 6. إنهاء البيع واحتساب الربح الحقيقي بدقة (سعر البيع - سعر الشراء)
// ==========================================================================
function checkout() {
    if (cart.length === 0) { alert("السلة فارغة حالياً!"); return; }
    
    let total = 0;
    let totalInvoiceProfit = 0; 
    let customerSelect = document.getElementById("salesCustomerSelect");
    let customerName = customerSelect ? customerSelect.options[customerSelect.selectedIndex].text : "عميل نقدي سريع";

    cart.forEach(item => {
        let itemPrice = Number(item.price) || 0;
        let itemCost = Number(item.cost) || 0;
        
        total += (itemPrice * item.quantity);
        totalInvoiceProfit += ((itemPrice - itemCost) * item.quantity);

        let med = medicines.find(m => m.id === item.id);
        if (med) med.stock -= item.quantity;
    });

    let invoiceId = Date.now();
    let invoiceDate = new Date().toLocaleDateString('ar-YE');

    let newInvoice = { 
        id: invoiceId, 
        total: total, 
        profit: totalInvoiceProfit, 
        date: invoiceDate, 
        customer: customerName, 
        items: [...cart] 
    };
    
    invoices.push(newInvoice);
    saveData(); 

    let printHTML = `
        <div id="invoiceToPdf" style="text-align:center; font-family: Tahoma, Arial, sans-serif; direction: rtl; padding: 10px;">
            <h2>صيدلية المدينة الذكية</h2>
            <p><b>فاتورة مبيعات رقم:</b> #${invoiceId}</p>
            <p><b>التاريخ:</b> ${invoiceDate}</p>
            <p><b>العميل:</b> ${customerName}</p>
            <hr style="border-top:1px dashed #000; margin: 10px 0;">
            <table style="width:100%; text-align:right; font-size:14px; border-collapse: collapse;">
                <thead>
                    <tr style="border-bottom: 1px solid #000;">
                        <th>الصنف</th>
                        <th style="text-align:center;">الكمية</th>
                        <th style="text-align:left;">السعر</th>
                    </tr>
                </thead>
                <tbody>`;
    cart.forEach(i => {
        printHTML += `<tr><td>${i.name}</td><td style="text-align:center;">${i.quantity}</td><td style="text-align:left;">${i.price * i.quantity} ريال</td></tr>`;
    });
    printHTML += `</tbody></table>
            <hr style="border-top:1px dashed #000; margin: 10px 0;">
            <h3 style="text-align:left; margin-top:10px;">الإجمالي النهائي: ${total} ريال</h3>
            <p style="margin-top:15px; font-size:12px;">شكراً لزيارتكم، دمتم بصحة وعافية</p>
        </div>`;

    document.getElementById("invoicePrintArea").innerHTML = printHTML;
    document.getElementById("printInvoiceModal").style.display = "flex";

    cart = [];
    renderCart(); 
    renderMedicines(); 
    renderInvoices(); 
    loadDashboard();
}

function closeModal() { 
    document.getElementById("printInvoiceModal").style.display = "none"; 
}

function renderInvoices() {
    let box = document.getElementById("invoices");
    if (!box) return; 
    box.innerHTML = "";
    
    [...invoices].reverse().forEach(inv => {
        box.innerHTML += `
            <div class="data-card" style="border-right: 5px solid #64748b;">
                <h3>🧾 فاتورة #${inv.id}</h3>
                <p>📅 التاريخ: ${inv.date}</p>
                <p>👤 العميل: ${inv.customer}</p>
                <p>💰 القيمة الإجمالية: <b>${Number(inv.total).toFixed(2)} ريال</b></p>
                <p>📈 الأرباح الحقيقية: <b>${(Number(inv.profit) || 0).toFixed(2)} ريال</b></p>
            </div>`;
    });
}

// ==========================================================================
// 7. إدارة العملاء والموردين (تم التأكيد على مطابقة الـ IDs وإصلاح الخلل هنا)
// ==========================================================================
function addCustomer() {
    let name = document.getElementById("customerName").value.trim();
    let phone = document.getElementById("customerPhone").value.trim();
    
    if(name === "" || phone === "") { 
        alert("الرجاء إدخال اسم العميل ورقم الهاتف بالكامل!"); 
        return; 
    }
    
    customers.push({ id: Date.now(), name, phone });
    saveData(); 
    clearInputs(['customerName', 'customerPhone']);
    renderCustomers(); 
    updateSalesCustomerDropdown(); 
    loadDashboard();
}

function renderCustomers() {
    let box = document.getElementById("customerList");
    if (!box) return; box.innerHTML = "";
    customers.forEach(c => { 
        box.innerHTML += `<div class="data-card"><h3>👥 ${c.name}</h3><p>📞 رقم الهاتف: ${c.phone || 'لا يوجد'}</p></div>`; 
    });
}

function updateSalesCustomerDropdown() {
    let select = document.getElementById("salesCustomerSelect");
    if(!select) return;
    select.innerHTML = '<option value="">عميل نقدي سريع</option>';
    customers.forEach(c => { 
        select.innerHTML += `<option value="${c.id}">${c.name}</option>`; 
    });
}

// دالة إضافة المورد المصححة والمضمونة 100%
function addSupplier() {
    let nameInput = document.getElementById("supplierName");
    let phoneInput = document.getElementById("supplierPhone");

    if (!nameInput || !phoneInput) {
        console.error("عناصر الإدخال الخاصة بالموردين غير موجودة في الصفحة!");
        return;
    }

    let name = nameInput.value.trim();
    let phone = phoneInput.value.trim();
    
    if (name === "" || phone === "") { 
        alert("الرجاء إدخال اسم المورد ورقم التواصل!"); 
        return; 
    }
    
    suppliers.push({ id: Date.now(), name: name, phone: phone });
    saveData(); 
    
    // تفريغ الحقول يدوياً لضمان عدم حدوث مشاكل في دالة clearInputs
    nameInput.value = "";
    phoneInput.value = "";
    
    renderSuppliers();
    alert("تم إضافة المورد بنجاح ✅");
}

function renderSuppliers() {
    let box = document.getElementById("supplierList");
    if (!box) return; 
    box.innerHTML = "";
    
    suppliers.forEach(s => { 
        box.innerHTML += `
            <div class="data-card" style="border-right: 5px solid #0f766e;">
                <h3>📦 ${s.name}</h3>
                <p>📞 هاتف التواصل: ${s.phone || 'لا يوجد'}</p>
            </div>`; 
    });
}

// ==========================================================================
// 8. نظام البحث الشامل
// ==========================================================================
function switchSearchTab(tab) {
    currentSearchTab = tab;
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    if(tab === 'med') document.getElementById("tabMed").classList.add("active");
    if(tab === 'cust') document.getElementById("tabCust").classList.add("active");
    if(tab === 'inv') document.getElementById("tabInv").classList.add("active");
    globalSearch();
}

function globalSearch() {
    let value = document.getElementById("searchInput").value.toLowerCase().trim();
    let resBox = document.getElementById("searchResults");
    if(!resBox) return;
    resBox.innerHTML = "";

    if (currentSearchTab === 'med') {
        medicines.filter(m => m.name.toLowerCase().includes(value)).forEach(med => {
            resBox.innerHTML += `<div class="data-card"><h3>💊 ${med.name}</h3><p>السعر: ${med.price} ريال</p><p>المخزن: ${med.stock}</p></div>`;
        });
    } else if (currentSearchTab === 'cust') {
        customers.filter(c => c.name.toLowerCase().includes(value) || c.phone.includes(value)).forEach(c => {
            resBox.innerHTML += `<div class="data-card"><h3>👥 ${c.name}</h3><p>الهاتف: ${c.phone}</p></div>`;
        });
    } else if (currentSearchTab === 'inv') {
        invoices.filter(i => i.id.toString().includes(value) || i.customer.toLowerCase().includes(value)).forEach(inv => {
            resBox.innerHTML += `<div class="data-card"><h3>🧾 فاتورة #${inv.id}</h3><p>العميل: ${inv.customer}</p><p>الإجمالي: ${inv.total} ريال</p></div>`;
        });
    }
}

function clearInputs(arr) { 
    arr.forEach(id => {
        let el = document.getElementById(id);
        if(el) el.value = "";
    }); 
}
