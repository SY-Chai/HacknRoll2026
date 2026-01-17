export const locations = [
  {
    id: "fort-canning",
    title: "Fort Canning Hill",
    shortDescription: "The Forbidden Hill of ancient kings.",
    fullDescription: "Since the 14th century, this hill has overlooked the city, serving as the seat of Malay royalty and later a British command centre.",
    era: "1300s - Present",
    color: "#4dff91",
    coordinates: [1.2929, 103.8469], // Real coords, though we'll use 3D
    chapters: [
      {
        id: "fc-1",
        title: "The Forbidden Hill",
        text: "Known as Bukit Larangan, legend says the ancient kings of Singapura ruled from this summit. It was a sacred place where commoners were forbidden to ascend.",
        visualFocus: "temple_ruins"
      },
      {
        id: "fc-2",
        title: "The British Arrival",
        text: "In 1819, Sir Stamford Raffles built his first residence here. The hill was transformed into a fortification to defend the harbor.",
        visualFocus: "colonial_house"
      },
      {
        id: "fc-3",
        title: "Battle Box",
        text: "Deep underground lies the Battle Box, where the decision to surrender Singapore to the Japanese was made on 15 February 1942.",
        visualFocus: "bunker"
      }
    ]
  },
  {
    id: "chinatown",
    title: "Chinatown",
    shortDescription: "Bustling streets of early immigrants.",
    fullDescription: "The heart of Chinese settlement in early Singapore, filled with clan houses, opera theatres, and coolie quarters.",
    era: "1820s - Present",
    color: "#ff4d4d",
    coordinates: [1.2839, 103.8436],
    chapters: [
      {
        id: "cn-1",
        title: "The Landing",
        text: "Thousands of immigrants arrived by boat, seeking fortune in Nanyang. They settled here, dividing into dialect groups.",
        visualFocus: "boat_quay"
      },
      {
        id: "cn-2",
        title: "Life in Shophouses",
        text: "Cramped conditions in shophouses were common. Yet, the streets were alive with markets, festivals, and wayang performances.",
        visualFocus: "shophouse_street"
      }
    ]
  },
  {
    id: "civic-district",
    title: "Civic District",
    shortDescription: "The colonial heart of modern Singapore.",
    fullDescription: "Where modern Singapore began. The Padang, City Hall, and the Supreme Court stand as testaments to the colonial era and independence.",
    era: "1819 - Present",
    color: "#4d79ff",
    coordinates: [1.2895, 103.8510],
    chapters: [
      {
        id: "cd-1",
        title: "The Padang",
        text: "A playing field for cricket in colonial times, and the site where the National Day Parade was first held in 1966.",
        visualFocus: "green_field"
      }
    ]
  }
];
