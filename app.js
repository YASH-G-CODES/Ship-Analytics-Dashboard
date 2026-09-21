(() => {
  // =========================
  // PRODUCTS.CSV DATA
  // =========================
  const products = [
    ["P101", "Laptop", "Electronics"],
    ["P102", "Phone", "Electronics"],
    ["P103", "Chair", "Furniture"]
  ].map(([id, name, category]) => ({
    id,
    name,
    category
  }));


  // =========================
  // ORDERS.JSON DATA
  // =========================
  const orders = [
    {
      id: "#1001",
      customer: "Rahul",
      customerId: "C001",
      date: "01/01/2024",
      month: 1,
      items: 3,
      total: 2200,
      status: "Delivered"
    },
    {
      id: "#1002",
      customer: "Anita",
      customerId: "C002",
      date: "01/02/2024",
      month: 1,
      items: 3,
      total: 600,
      status: "Delayed"
    }
  ];


  // =========================
  // SHIPMENT.XML DATA
  // =========================
  const shipments = [
    {
      id: "S001",
      orderId: "1001",
      deliveryDays: 3,
      status: "Delivered"
    },
    {
      id: "S002",
      orderId: "1002",
      deliveryDays: 7,
      status: "Delayed"
    }
  ];


  // =========================
  // PRODUCT SALES
  // Based on orders.json items
  // =========================
  const productStats = {
    P101: {
      units: 2,
      revenue: 1000
    },
    P102: {
      units: 1,
      revenue: 1200
    },
    P103: {
      units: 3,
      revenue: 600
    }
  };


  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];


  const monthly = [
    2800,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0
  ];


  const state = {
    status: "all",
    metric: "revenue",
    view: "overview"
  };


 

  const money = n =>
  `₹${Math.round(n).toLocaleString("en-IN")}`;


  const filtered = () =>
    state.status === "all"
      ? orders
      : orders.filter(o => o.status === state.status);


  const el = id =>
    document.getElementById(id);


  // =========================
  // KPI CARDS
  // =========================
  function renderKpis() {
    const list = filtered();

    const revenue = list.reduce(
      (sum, order) => sum + order.total,
      0
    );

    const delayed = orders.filter(
      o => o.status === "Delayed"
    ).length;

    const delivered = orders.filter(
      o => o.status === "Delivered"
    ).length;

    const onTime =
      orders.length > 0
        ? (delivered / orders.length) * 100
        : 0;

    el("kpiGrid").innerHTML = [
      [
        "Total revenue",
        money(revenue),
        "Current orders",
        "green",
        "↗"
      ],
      [
        "Total orders",
        list.length.toLocaleString(),
        "Current orders",
        "orange",
        "▤"
      ],
      [
        "On-time delivery",
        `${onTime.toFixed(1)}%`,
        "Based on shipments",
        "blue",
        "⌁"
      ],
      [
        "Delayed orders",
        delayed,
        "From shipment.xml",
        "red",
        "!"
      ]
    ]
      .map(
        k => `
          <article class="kpi">
            <div class="kpi-top">
              <span>${k[0]}</span>
              <i class="kpi-icon ${k[3]}">${k[4]}</i>
            </div>

            <div class="kpi-value">${k[1]}</div>

            <div class="kpi-foot">
              ${k[2]}
            </div>
          </article>
        `
      )
      .join("");

    el("revenueTotal").textContent = money(revenue);
  }


  // =========================
  // REVENUE CHART
  // =========================
  function lineChart() {
    const W = 760;
    const H = 220;

    const p = {
      l: 35,
      r: 15,
      t: 13,
      b: 28
    };

    const max = 3000;

    const x = i =>
      p.l +
      i * (W - p.l - p.r) / 11;

    const y = v =>
      p.t +
      (H - p.t - p.b) *
        (1 - v / max);

    const pts = monthly
      .map(
        (v, i) =>
          `${x(i)},${y(v)}`
      )
      .join(" ");

    const area =
      `M${x(0)},${H - p.b} ` +
      `L${pts.replaceAll(" ", " L")} ` +
      `L${x(11)},${H - p.b} Z`;

    el("revenueChart").innerHTML = `
      <svg
        viewBox="0 0 ${W} ${H}"
        role="img"
        aria-label="Revenue trend chart"
      >

        ${[0, 1, 2, 3]
          .map(
            i => `
              <line
                class="grid-line"
                x1="${p.l}"
                y1="${p.t +
                i *
                  (H - p.t - p.b) /
                    3}"
                x2="${W - p.r}"
                y2="${p.t +
                i *
                  (H - p.t - p.b) /
                    3}"
              />
            `
          )
          .join("")}

        <path
          class="area-main"
          d="${area}"
        />

        <polyline
          class="line-main"
          points="${pts}"
        />

        ${monthly
          .map(
            (v, i) => `
              <circle
                class="chart-point"
                cx="${x(i)}"
                cy="${y(v)}"
                r="3"
              />
            `
          )
          .join("")}

        ${monthNames
          .map(
            (m, i) => `
              <text
                class="axis-label"
                x="${x(i)}"
                y="${H - 6}"
                text-anchor="middle"
              >
                ${m}
              </text>
            `
          )
          .join("")}

      </svg>
    `;
  }


  // =========================
  // DELIVERY CHART
  // =========================
  function deliveryChart() {
    const counts = {
      Delivered: orders.filter(
        o => o.status === "Delivered"
      ).length,

      Delayed: orders.filter(
        o => o.status === "Delayed"
      ).length,

      InTransit: orders.filter(
        o => o.status === "InTransit"
      ).length
    };

    const total = orders.length;

    const c = 2 * Math.PI * 55;

    const parts = [
      [
        "Delivered",
        counts.Delivered,
        "#31c5a1"
      ],
      [
        "Delayed",
        counts.Delayed,
        "#ee7d77"
      ],
      [
        "InTransit",
        counts.InTransit,
        "#ffb45c"
      ]
    ];

    let offset = 0;

    const rings = parts
      .map(p => {
        const dash =
          total > 0
            ? (p[1] / total) * c
            : 0;

        const r = `
          <circle
            cx="75"
            cy="75"
            r="55"
            stroke="${p[2]}"
            stroke-dasharray="${dash} ${c - dash}"
            stroke-dashoffset="${-offset}"
          />
        `;

        offset += dash;

        return r;
      })
      .join("");

    const percentage =
      total > 0
        ? Math.round(
            (counts.Delivered / total) * 100
          )
        : 0;

    el("deliveryChart").innerHTML = `
      <svg
        class="donut"
        viewBox="0 0 150 150"
      >
        <circle
          class="donut-bg"
          cx="75"
          cy="75"
          r="55"
        />

        ${rings}
      </svg>

      <div class="donut-label">
        <strong>${percentage}%</strong>
        <span>on time</span>
      </div>

      <div class="delivery-legend">
        ${parts
          .map(
            p => `
              <div>
                <b>${p[1]}</b>
                ${p[0]}
              </div>
            `
          )
          .join("")}
      </div>
    `;
  }


  // =========================
  // CATEGORY CHART
  // =========================
  function categories() {
    const categoryRevenue = {};

    products.forEach(product => {
      const stats =
        productStats[product.id] || {
          revenue: 0
        };

      categoryRevenue[product.category] =
        (categoryRevenue[product.category] || 0) +
        stats.revenue;
    });

    const values =
      Object.values(categoryRevenue);

    const max =
      values.length > 0
        ? Math.max(...values)
        : 1;

    el("categoryChart").innerHTML =
      Object.entries(categoryRevenue)
        .sort((a, b) => b[1] - a[1])
        .map(
          ([name, value], i) => `
            <div class="category-row">

              <span>${name}</span>

              <div class="bar-track">
                <div
                  class="bar-fill ${
                    ["teal", "blue", "amber", "red"][
                      i % 4
                    ]
                  }"
                  style="width:${
                    (value / max) * 100
                  }%"
                ></div>
              </div>

              <strong>
                ${money(value)}
              </strong>

            </div>
          `
        )
        .join("");
  }


  // =========================
  // RECENT ORDERS
  // =========================
  function recent() {
    el("recentOrders").innerHTML =
      orders
        .slice()
        .reverse()
        .map(
          order => `
            <div class="recent-order">

              <div class="order-symbol">
                ▤
              </div>

              <div>
                <strong>
                  ${order.id}
                </strong>

                <small>
                  ${order.customer}
                  ·
                  ${order.date}
                </small>
              </div>

              <div>

                <div class="amount">
                  ${money(order.total)}
                </div>

                <span
                  class="status ${order.status}"
                >
                  ${
                    order.status ===
                    "InTransit"
                      ? "In transit"
                      : order.status
                  }
                </span>

              </div>

            </div>
          `
        )
        .join("");
  }


  // =========================
  // TABLES
  // =========================
  function tables() {
    const rows = filtered();

    el("orderCount").textContent =
      `${rows.length} orders`;

    // Orders table
    el("ordersTable").innerHTML =
      rows
        .map(
          order => `
            <tr>

              <td>
                <strong>
                  ${order.id}
                </strong>
              </td>

              <td>
                ${order.customer}
              </td>

              <td>
                ${order.date}
              </td>

              <td>
                ${order.items} items
              </td>

              <td>
                <strong>
                  ${money(order.total)}
                </strong>
              </td>

              <td>
                <span
                  class="status ${order.status}"
                >
                  ${
                    order.status ===
                    "InTransit"
                      ? "In transit"
                      : order.status
                  }
                </span>
              </td>

            </tr>
          `
        )
        .join("");


    // Shipment table
    el("shipmentsTable").innerHTML =
      shipments
        .map(
          shipment => {
            const order =
              orders.find(
                o =>
                  o.id.replace("#", "") ===
                  shipment.orderId
              );

            return `
              <tr>

                <td>
                  <strong>
                    ${shipment.id}
                  </strong>
                </td>

                <td>
                  ${order ? order.id : shipment.orderId}
                </td>

                <td>
                  ${order ? order.customer : "Unknown"}
                </td>

                <td>
                  ${shipment.deliveryDays} days
                </td>

                <td>
                  <span
                    class="status ${shipment.status}"
                  >
                    ${shipment.status}
                  </span>
                </td>

              </tr>
            `;
          }
        )
        .join("");


    // Product table
    const totalProductRevenue =
      Object.values(productStats)
        .reduce(
          (sum, product) =>
            sum + product.revenue,
          0
        );

    el("productsTable").innerHTML =
      products
        .map(product => {

          const stats =
            productStats[product.id] || {
              units: 0,
              revenue: 0
            };

          const percentage =
            totalProductRevenue > 0
              ? (
                  stats.revenue /
                  totalProductRevenue *
                  100
                ).toFixed(1)
              : "0.0";

          return `
            <tr>

              <td>

                <strong>
                  ${product.name}
                </strong>

                <small
                  style="
                    display:block;
                    color:#9aa6b4;
                    margin-top:3px
                  "
                >
                  ${product.id}
                </small>

              </td>

              <td>
                ${product.category}
              </td>

              <td>
                ${stats.units}
              </td>

              <td>
                <strong>
                  ${money(stats.revenue)}
                </strong>
              </td>

              <td>
                ${percentage}%
              </td>

            </tr>
          `;
        })
        .join("");


    // Shipment summary
    el("shipmentSummary").innerHTML = `
      <span>
        <i class="green-dot"></i>
        ${
          shipments.filter(
            s => s.status === "Delivered"
          ).length
        }
        delivered
      </span>

      <span>
        <i class="orange-dot"></i>
        ${
          shipments.filter(
            s => s.status === "InTransit"
          ).length
        }
        in transit
      </span>

      <span>
        <i class="red-dot"></i>
        ${
          shipments.filter(
            s => s.status === "Delayed"
          ).length
        }
        delayed
      </span>
    `;
  }


  // =========================
  // DATA PIPELINE
  // =========================
  function pipeline() {

    el("pipelineCards").innerHTML = [

      [
        "CSV",
        "Product catalog",
        "Product ID, product name and category.",
        "products.csv → 3 products"
      ],

      [
        "JSON",
        "Order feed",
        "Customer, items, quantity, price and order date.",
        "orders.json → 2 orders"
      ],

      [
        "XML",
        "Shipment feed",
        "Shipment ID, order ID, delivery days and status.",
        "shipment.xml → 2 shipments"
      ]

    ]
      .map(
        c => `
          <article class="pipeline-card">

            <div class="source-icon">
              ${c[0]}
            </div>

            <h3>
              ${c[1]}
            </h3>

            <p>
              ${c[2]}
            </p>

            <code>
              ${c[3]}
            </code>

          </article>
        `
      )
      .join("");


    el("qualityRows").innerHTML = [

      [
        "orders.json",
        "Order 1001",
        "Customer Rahul with 2 products"
      ],

      [
        "orders.json",
        "Order 1002",
        "Customer Anita with 1 product"
      ],

      [
        "shipment.xml",
        "Shipment S001",
        "Delivered in 3 days"
      ],

      [
        "shipment.xml",
        "Shipment S002",
        "Delayed for 7 days"
      ]

    ]
      .map(
        row => `
          <div class="quality-row">

            <span>
              ${row[0]}
            </span>

            <strong>
              ${row[1]}
            </strong>

            <span>
              ${row[2]}
            </span>

          </div>
        `
      )
      .join("");
  }


  // =========================
  // RENDER
  // =========================
  function render() {
    renderKpis();
    lineChart();
    deliveryChart();
    categories();
    recent();
    tables();
    pipeline();
  }


  // =========================
  // VIEW CHANGE
  // =========================
  function showView(view) {

    state.view = view;

    document
      .querySelectorAll(".view")
      .forEach(v =>
        v.classList.toggle(
          "active-view",
          v.id === `view-${view}`
        )
      );

    document
      .querySelectorAll(".nav-item")
      .forEach(n =>
        n.classList.toggle(
          "active",
          n.dataset.view === view
        )
      );

    el("pageTitle").innerHTML =
      view === "overview"
        ? "Good evening, Yash <span>✦</span>"
        : view[0].toUpperCase() +
          view.slice(1);

    if (innerWidth < 721) {
      el("sidebar").classList.remove(
        "open"
      );
    }
  }


  // =========================
  // NAVIGATION
  // =========================
  document
    .querySelectorAll(".nav-item")
    .forEach(button =>
      button.addEventListener(
        "click",
        () =>
          showView(
            button.dataset.view
          )
      )
    );


  document
    .querySelectorAll(
      "[data-view-link]"
    )
    .forEach(button =>
      button.addEventListener(
        "click",
        () =>
          showView(
            button.dataset.viewLink
          )
      )
    );


  // =========================
  // FILTER
  // =========================
  document
    .querySelectorAll(".filter-chip")
    .forEach(button =>
      button.addEventListener(
        "click",
        () => {

          state.status =
            button.dataset.filter;

          document
            .querySelectorAll(
              ".filter-chip"
            )
            .forEach(x =>
              x.classList.toggle(
                "active",
                x === button
              )
            );

          render();
        }
      )
    );


  // =========================
  // SEGMENTED BUTTONS
  // =========================
  document
    .querySelectorAll(
      ".segmented button"
    )
    .forEach(button =>
      button.addEventListener(
        "click",
        () => {

          document
            .querySelectorAll(
              ".segmented button"
            )
            .forEach(x =>
              x.classList.toggle(
                "active",
                x === button
              )
            );

          toast(
            `${button.textContent} view selected`
          );
        }
      )
    );


  // =========================
  // MOBILE MENU
  // =========================
  el("mobileMenu")
    .addEventListener(
      "click",
      () =>
        el("sidebar").classList.toggle(
          "open"
        )
    );


  // =========================
  // REFRESH
  // =========================
  el("refreshButton")
    .addEventListener(
      "click",
      () => {
        toast(
          "Data refreshed from local sources"
        );

        render();
      }
    );


  // =========================
  // EXPORT CSV
  // =========================
  el("exportButton")
    .addEventListener(
      "click",
      () => {

        const csv = [
          "Order,Customer,Date,Total,Status",

          ...orders.map(
            order =>
              [
                order.id,
                order.customer,
                order.date,
                order.total,
                order.status
              ].join(",")
          )

        ].join("\n");


        const a =
          document.createElement("a");

        a.href =
          URL.createObjectURL(
            new Blob(
              [csv],
              {
                type: "text/csv"
              }
            )
          );

        a.download =
          "shipsight-orders.csv";

        a.click();

        toast(
          "Report exported as CSV"
        );
      }
    );


  // =========================
  // SEARCH
  // =========================
  el("orderSearch")
    .addEventListener(
      "input",
      event => {

        const query =
          event.target.value.toLowerCase();

        document
          .querySelectorAll(
            "#ordersTable tr"
          )
          .forEach(row => {

            row.style.display =
              row.textContent
                .toLowerCase()
                .includes(query)
                ? ""
                : "none";

          });
      }
    );


  // =========================
  // TOAST
  // =========================
  function toast(message) {

    const t = el("toast");

    t.textContent = message;

    t.classList.add("show");

    setTimeout(
      () =>
        t.classList.remove(
          "show"
        ),
      2200
    );
  }


  // =========================
  // INITIAL RENDER
  // =========================
  render();

})();