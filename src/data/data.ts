//IMG-in Jamanakavor dzeva, minchev chgna sax backend!!!
//IMG-in Jamanakavor dzeva, minchev chgna sax backend!!!
//IMG-in Jamanakavor dzeva, minchev chgna sax backend!!!

import type { ChooseUsCard, Partner, BlogPost } from "../types";
import img from "../assets/choosUsCardImg1.png";
import nike from "../assets/nikeLogo.png";
import coffeHouse from "../assets/coffeHouseLogo.png";
import blogImg1 from "../assets/blogImg1.webp";
import blogImg2 from "../assets/blogImg2.webp";
import blogImg3 from "../assets/blogImg3.webp";


export const chooseUsCardData: ChooseUsCard[] = [
  {
     id:1,
     text: "We have Ideas",
     title: "ImUsum understands that learning is not just about grades. it's about the journey and the motivation to excel.",
     image:img
  },

  {
    id:2,
    text: "We have Ideas",
    title: "ImUsum understands that learning is not just about grades. it's about the journey and the motivation to excel.",
    image:img
 },

 {
  id:3,
  text: "We have Ideas",
  title: "ImUsum understands that learning is not just about grades. it's about the journey and the motivation to excel.",
  image:img
},

{
  id:4,
  text: "We have Ideas",
  title: "ImUsum understands that learning is not just about grades. it's about the journey and the motivation to excel.",
  image:img
},

{
  id:5,
  text: "We have Ideas",
  title: "ImUsum understands that learning is not just about grades. it's about the journey and the motivation to excel.",
  image:img
},

{
  id:6,
  text: "We have Ideas",
  title: "ImUsum understands that learning is not just about grades. it's about the journey and the motivation to excel.",
  image:img
},
]

export const partners: Partner[] = [
  {
    id:7,
    image:nike
  },
  {
    id:8,
    image:coffeHouse
  },
  {
    id:9,
    image:nike
  },
  {
    id:10,
    image:coffeHouse
  },

  {
    id:11,
    image:nike
  },
  {
    id:12,
    image:coffeHouse
  },
  {
    id:13,
    image:nike
  }
]

export const blog: BlogPost[] = [
  {
    id:14,
    image:blogImg1,
    title:"ImUsum new update!",
    letter:"We are thrilled to announce the latest and most significant update to the ImUsum app, ushering in a new era of enhanced learning experiences and cutting-edge features.",
    date:"2023-01-01",
    hot:true,
  },
  {
    id:14,
    image:blogImg2,
    title:"ImUsum new update!",
    letter:"We are thrilled to announce the latest and most significant update to the ImUsum app, ushering in a new era of enhanced learning experiences and cutting-edge features.",
    date:"2023-01-01",
    hot:false,
  },
  {
    id:14,
    image:blogImg3,
    title:"ImUsum new update!",
    letter:"We are thrilled to announce the latest and most significant update to the ImUsum app, ushering in a new era of enhanced learning experiences and cutting-edge features.",
    date:"2023-01-01",
    hot:false,
  },
]
