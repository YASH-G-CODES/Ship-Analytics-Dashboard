

The user's original sample rows (orders 1001/1002, shipments S001/S002,
products P101-P103) are kept byte-for-byte in meaning. Extra rows are added so
growth charts have something to show, plus a few deliberately dirty records to
exercise the cleaning logic.
"""
import json, random, datetime as dt, os

random.seed(42)
OUT = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(OUT, exist_ok=True)

# ---------------------------------------------------------------- products
products = [
    ("P101", "Laptop", "Electronics", 500),
    ("P102", "Phone", "Electronics", 1200),
    ("P103", "Chair", "Furniture", 200),
    
]
price_of = {p[0]: p[3] for p in products}
weights = {"P101": 5, "P102": 4, "P103": 4, "P104": 3, "P105": 4,
           "P106": 3, "P107": 4, "P108": 2, "P109": 3, "P110": 2}

with open(f"{OUT}/products.csv", "w", newline="", encoding="utf-8") as f:
    f.write("ProductID,ProductName,Category\n")
    for pid, name, cat, _ in products:
        f.write(f"{pid},{name},{cat}\n")

# ------------------------------------------------------------------ orders
customers = [
    ("C001", "Rahul"), ("C002", "Anita"), ("C003", "Vikram"), ("C004", "Priya"),
    ("C005", "Arjun"), ("C006", "Sneha"), ("C007", "Karan"), ("C008", "Meera"),
    ("C009", "Rohan"), ("C010", "Divya"), ("C011", "Aditya"), ("C012", "Neha"),
]
per_month = [3, 4, 5, 5, 6, 7, 7, 8, 9, 9, 10, 11]  # 84 orders, growing
dates = []
for m, n in enumerate(per_month, start=1):
    days = sorted(random.sample(range(1, 29), n))
    for d in days:
        dates.append(dt.date(2024, m, d))
dates[0], dates[1] = dt.date(2024, 1, 1), dt.date(2024, 1, 2)
dates.sort()

orders = []
for i, d in enumerate(dates):
    oid = 1001 + i
    if oid == 1001:
        cust = customers[0]
        items = [{"product_id": "P101", "qty": 2, "price": 500},
                 {"product_id": "P102", "qty": 1, "price": 1200}]
    elif oid == 1002:
        cust = customers[1]
        items = [{"product_id": "P103", "qty": 3, "price": 200}]
    else:
        cust = random.choice(customers)
        n_items = random.choices([1, 2, 3], weights=[5, 4, 1])[0]
        pids = []
        while len(pids) < n_items:
            p = random.choices(list(weights), weights=list(weights.values()))[0]
            if p not in pids:
                pids.append(p)
        items = []
        for p in pids:
            base = price_of[p]
            price = base if random.random() < 0.7 else int(base * random.choice([0.9, 0.95, 1.05]))
            items.append({"product_id": p, "qty": random.choices([1, 2, 3], weights=[6, 3, 1])[0], "price": price})
    orders.append({
        "order_id": str(oid),
        "customer": {"id": cust[0], "name": cust[1]},
        "items": items,
        "order_date": d.isoformat(),
    })

by_id = {o["order_id"]: o for o in orders}
# --- deliberately dirty records (documented in the app's quality report) ---
by_id["1017"]["items"][0]["price"] = None                       # missing price
by_id["1023"]["items"][0]["qty"] = str(by_id["1023"]["items"][0]["qty"])  # qty as string
by_id["1031"]["customer"] = None                                # missing customer
by_id["1044"]["items"][0]["product_id"] = " p104"               # whitespace + lowercase id
by_id["1052"]["items"][0]["product_id"] = "P999"                # unknown product
d60 = dt.date.fromisoformat(by_id["1060"]["order_date"])
by_id["1060"]["order_date"] = d60.strftime("%d/%m/%Y")          # dd/mm/yyyy date
by_id["1047"]["order_date"] = None                              # missing date
by_id["1075"]["items"] = []                                     # empty order
orders.insert(orders.index(by_id["1070"]) + 1, json.loads(json.dumps(by_id["1070"])))  # duplicate

with open(f"{OUT}/orders.json", "w", encoding="utf-8") as f:
    json.dump({"orders": orders}, f, indent=2)
    f.write("\n")

# --------------------------------------------------------------- shipments
ship_rows = []
n = 0
no_shipment = {"1009", "1082", "1083", "1084"}
in_transit = {"1076", "1077", "1078", "1079", "1080", "1081"}
force_delivered_late = {"1038": 7, "1049": 8}      # Delivered but > 5 days
for o in orders[:]:
    oid = o["order_id"]
    if oid in no_shipment or o is not by_id.get(oid) and oid == "1070":
        continue
    n += 1
    sid = f"S{n:03d}"
    if oid == "1001":
        days, status = "3", "Delivered"
    elif oid == "1002":
        days, status = "7", "Delayed"
    elif oid in in_transit:
        days, status = str(random.randint(1, 3)), "InTransit"
    elif oid in force_delivered_late:
        days, status = str(force_delivered_late[oid]), "Delivered"
    elif random.random() < 0.18:
        days, status = str(random.randint(6, 10)), "Delayed"
    else:
        days, status = str(random.randint(2, 5)), "Delivered"
    # dirty shipments
    if oid == "1012": days = ""                 # missing delivery_days
    if oid == "1026": days = "N/A"              # non-numeric delivery_days
    if oid == "1019": status = "delivered"      # wrong casing
    if oid == "1041": status = "delayed"
    if oid == "1056": status = "Delivered "     # trailing space
    ship_rows.append((sid, oid, days, status))
ship_rows.append(("S999", "1999", "4", "Delivered"))   # orphan shipment (no such order)

with open(f"{OUT}/shipments.xml", "w", encoding="utf-8") as f:
    f.write("<shipments>\n")
    for sid, oid, days, status in ship_rows:
        f.write("  <shipment>\n")
        f.write(f"    <shipment_id>{sid}</shipment_id>\n")
        f.write(f"    <order_id>{oid}</order_id>\n")
        f.write(f"    <delivery_days>{days}</delivery_days>\n")
        f.write(f"    <status>{status}</status>\n")
        f.write("  </shipment>\n")
    f.write("</shipments>\n")

# ---------------------------------------------------------- countries sample
# (name, cca2, region, population, area km2, [(code, name, symbol)], [languages], [borders], capital)
C = [
 ("India","IN","Asia",1417173173,3287590,[("INR","Indian rupee","₹")],["Hindi","English","Tamil"],["BGD","BTN","MMR","CHN","NPL","PAK"],"New Delhi"),
 ("China","CN","Asia",1402112000,9706961,[("CNY","Chinese yuan","¥")],["Chinese"],["AFG","BTN","MMR","HKG","IND","KAZ","PRK","KGZ","LAO","MAC","MNG","NPL","PAK","RUS","TJK","VNM"],"Beijing"),
 ("United States","US","Americas",329484123,9372610,[("USD","United States dollar","$")],["English"],["CAN","MEX"],"Washington, D.C."),
 ("Indonesia","ID","Asia",273523621,1904569,[("IDR","Indonesian rupiah","Rp")],["Indonesian"],["MYS","PNG","TLS"],"Jakarta"),
 ("Pakistan","PK","Asia",240485658,881912,[("PKR","Pakistani rupee","₨")],["English","Urdu"],["AFG","CHN","IND","IRN"],"Islamabad"),
 ("Brazil","BR","Americas",212559409,8515767,[("BRL","Brazilian real","R$")],["Portuguese"],["ARG","BOL","COL","GUF","GUY","PRY","PER","SUR","URY","VEN"],"Brasília"),
 ("Nigeria","NG","Africa",206139587,923768,[("NGN","Nigerian naira","₦")],["English"],["BEN","CMR","TCD","NER"],"Abuja"),
 ("Bangladesh","BD","Asia",164689383,147570,[("BDT","Bangladeshi taka","৳")],["Bengali"],["MMR","IND"],"Dhaka"),
 ("Russia","RU","Europe",144104080,17098242,[("RUB","Russian ruble","₽")],["Russian"],["AZE","BLR","CHN","EST","FIN","GEO","KAZ","PRK","LVA","LTU","MNG","NOR","POL","UKR"],"Moscow"),
 ("Mexico","MX","Americas",128932753,1964375,[("MXN","Mexican peso","$")],["Spanish"],["BLZ","GTM","USA"],"Mexico City"),
 ("Japan","JP","Asia",125836021,377930,[("JPY","Japanese yen","¥")],["Japanese"],[],"Tokyo"),
 ("Ethiopia","ET","Africa",114963583,1104300,[("ETB","Ethiopian birr","Br")],["Amharic"],["DJI","ERI","KEN","SOM","SSD","SDN"],"Addis Ababa"),
 ("Egypt","EG","Africa",102334403,1002450,[("EGP","Egyptian pound","£")],["Arabic"],["ISR","LBY","PSE","SDN"],"Cairo"),
 ("Vietnam","VN","Asia",97338583,331212,[("VND","Vietnamese đồng","₫")],["Vietnamese"],["KHM","CHN","LAO"],"Hanoi"),
 ("Turkey","TR","Asia",84339067,783562,[("TRY","Turkish lira","₺")],["Turkish"],["ARM","AZE","BGR","GEO","GRC","IRN","IRQ","SYR"],"Ankara"),
 ("Germany","DE","Europe",83240525,357114,[("EUR","Euro","€")],["German"],["AUT","BEL","CZE","DNK","FRA","LUX","NLD","POL","CHE"],"Berlin"),
 ("Thailand","TH","Asia",69799978,513120,[("THB","Thai baht","฿")],["Thai"],["MMR","KHM","LAO","MYS"],"Bangkok"),
 ("United Kingdom","GB","Europe",67215293,242900,[("GBP","British pound","£")],["English"],["IRL"],"London"),
 ("France","FR","Europe",67391582,551695,[("EUR","Euro","€")],["French"],["AND","BEL","DEU","ITA","LUX","MCO","ESP","CHE"],"Paris"),
 ("Italy","IT","Europe",59554023,301336,[("EUR","Euro","€")],["Italian"],["AUT","FRA","SMR","SVN","CHE","VAT"],"Rome"),
 ("South Africa","ZA","Africa",59308690,1221037,[("ZAR","South African rand","R")],["Afrikaans","English","Zulu"],["BWA","LSO","MOZ","NAM","SWZ","ZWE"],"Pretoria"),
 ("Kenya","KE","Africa",53771300,580367,[("KES","Kenyan shilling","Sh")],["English","Swahili"],["ETH","SOM","SSD","TZA","UGA"],"Nairobi"),
 ("South Korea","KR","Asia",51780579,100210,[("KRW","South Korean won","₩")],["Korean"],["PRK"],"Seoul"),
 ("Colombia","CO","Americas",50882884,1141748,[("COP","Colombian peso","$")],["Spanish"],["BRA","ECU","PAN","PER","VEN"],"Bogotá"),
 ("Spain","ES","Europe",47351567,505992,[("EUR","Euro","€")],["Spanish"],["AND","FRA","GIB","PRT","MAR"],"Madrid"),
 ("Argentina","AR","Americas",45376763,2780400,[("ARS","Argentine peso","$")],["Spanish"],["BOL","BRA","CHL","PRY","URY"],"Buenos Aires"),
 ("Canada","CA","Americas",38005238,9984670,[("CAD","Canadian dollar","$")],["English","French"],["USA"],"Ottawa"),
 ("Saudi Arabia","SA","Asia",34813867,2149690,[("SAR","Saudi riyal","ر.س")],["Arabic"],["IRQ","JOR","KWT","OMN","QAT","ARE","YEM"],"Riyadh"),
 ("Australia","AU","Oceania",25687041,7692024,[("AUD","Australian dollar","$")],["English"],[],"Canberra"),
 ("Chile","CL","Americas",19116209,756102,[("CLP","Chilean peso","$")],["Spanish"],["ARG","BOL","PER"],"Santiago"),
 ("Netherlands","NL","Europe",17441139,41850,[("EUR","Euro","€")],["Dutch"],["BEL","DEU"],"Amsterdam"),
 ("Sweden","SE","Europe",10353442,450295,[("SEK","Swedish krona","kr")],["Swedish"],["FIN","NOR"],"Stockholm"),
 ("United Arab Emirates","AE","Asia",9890400,83600,[("AED","United Arab Emirates dirham","د.إ")],["Arabic"],["OMN","SAU"],"Abu Dhabi"),
 ("Switzerland","CH","Europe",8654622,41284,[("CHF","Swiss franc","Fr.")],["German","French","Italian"],["AUT","FRA","ITA","LIE","DEU"],"Bern"),
 ("Norway","NO","Europe",5379475,323802,[("NOK","Norwegian krone","kr")],["Norwegian"],["FIN","SWE","RUS"],"Oslo"),
 ("Singapore","SG","Asia",5685807,710,[("SGD","Singapore dollar","$")],["English","Malay","Tamil"],[],"Singapore"),
 ("New Zealand","NZ","Oceania",5084300,270467,[("NZD","New Zealand dollar","$")],["English","Maori"],[],"Wellington"),
 ("Panama","PA","Americas",4314768,75417,[("PAB","Panamanian balboa","B/."),("USD","United States dollar","$")],["Spanish"],["COL","CRI"],"Panama City"),
 ("Iceland","IS","Europe",366425,103000,[("ISK","Icelandic króna","kr")],["Icelandic"],[],"Reykjavik"),
]
countries = []
for name, cca2, region, pop, area, curs, langs, borders, cap in C:
    countries.append({
        "name": {"common": name},
        "cca2": cca2,
        "region": region,
        "population": pop,
        "area": area,
        "capital": [cap],
        "currencies": {c: {"name": n, "symbol": s} for c, n, s in curs},
        "languages": {l[:3].lower() + str(i): l for i, l in enumerate(langs)},
        "borders": borders,
        "flags": {"png": f"https://flagcdn.com/w40/{cca2.lower()}.png"},
    })
with open(f"{OUT}/countries-sample.json", "w", encoding="utf-8") as f:
    json.dump(countries, f, ensure_ascii=False, indent=1)
    f.write("\n")

rates = {
    "base": "USD",
    "note": "Approximate offline fallback rates. The app tries a live API first.",
    "rates": {"USD": 1, "INR": 84.0, "EUR": 0.92, "GBP": 0.78, "JPY": 150.0,
              "AUD": 1.5, "CAD": 1.36, "AED": 3.6725, "SGD": 1.34},
}
with open(f"{OUT}/currency-rates.json", "w", encoding="utf-8") as f:
    json.dump(rates, f, indent=2)
    f.write("\n")

# ------------------------------------------------- embedded copy (file:// use)
def read(p):
    with open(f"{OUT}/{p}", encoding="utf-8") as fh:
        return fh.read()

embedded = {
    "orders": read("orders.json"),
    "shipments": read("shipments.xml"),
    "products": read("products.csv"),
    "countries": read("countries-sample.json"),
    "rates": read("currency-rates.json"),
}
with open(f"{OUT}/embedded-data.js", "w", encoding="utf-8") as f:
    f.write("/* Auto-generated copy of the files in /data.\n"
            "   Browsers block fetch() on file:// pages, so the app falls back to these\n"
            "   strings when it is opened by double-clicking index.html. */\n")
    f.write("window.EMBEDDED_DATA = " + json.dumps(embedded, ensure_ascii=False, indent=1) + ";\n")

print("orders:", len(orders), "shipments:", len(ship_rows))
