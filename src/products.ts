import mid1 from '../Image/mid1.jpeg'
import mid2 from '../Image/mid2.jpeg'
import mid3 from '../Image/mid3.jpeg'
import mid4 from '../Image/mid4.jpeg'
import mid5 from '../Image/mid5.jpeg'
import mid6 from '../Image/mid6.jpeg'
import mid7 from '../Image/mid7.jpeg'

export type StoreProduct = {
  id: number
  title: string
  description: string
  category: string
  price: number
  image: string
  brand: string
  tag?: string
}

export const products: StoreProduct[] = [
  {
    id: 1,
    title: 'Signature Custom Hoodie',
    description: 'A heavyweight black pullover, personalized with your own name and artwork. Built around your idea and made to rep your crew.',
    category: 'Hoodies',
    price: 300,
    image: mid1,
    brand: 'Beastmode Merch',
    tag: 'Custom',
  },
  {
    id: 2,
    title: 'Outlaw Bloodline Tee',
    description: 'A bold back print across three colorways. Find your fit in black, red, or olive.',
    category: 'T-Shirts',
    price: 100,
    image: mid2,
    brand: 'Outlaw Bloodline',
    tag: 'Three colorways',
  },
  {
    id: 3,
    title: 'Beastmode Merch Tee',
    description: 'Black graphic tee with the Beastmode mark on the front. A clean staple for the Rebel Family.',
    category: 'T-Shirts',
    price: 85,
    image: mid3,
    brand: 'Beastmode Merch',
    tag: 'Fan favorite',
  },
  {
    id: 4,
    title: 'Birthday Bash Hoodie',
    description: 'A personalized front and back print for your next big day. Custom lettering brings the whole look together.',
    category: 'Hoodies',
    price: 300,
    image: mid4,
    brand: 'Beastmode Merch',
    tag: 'Custom',
  },
  {
    id: 5,
    title: 'Hoodie & Gift Package',
    description: 'A custom hoodie with matching Rebel Family accessories, packaged together as one gift set.',
    category: 'Gift Sets',
    price: 500,
    image: mid5,
    brand: 'Rebel Family',
    tag: 'Gift set',
  },
  {
    id: 6,
    title: 'Outlaw Bloodline Shirt',
    description: 'The Outlaw Bloodline back graphic in black, red, or olive. Pick a color that feels like you.',
    category: 'T-Shirts',
    price: 100,
    image: mid6,
    brand: 'Outlaw Bloodline',
    tag: 'Three colorways',
  },
  {
    id: 7,
    title: 'Wild Hearts Dynasty Hoodie',
    description: 'A three-color hoodie drop featuring the Wild Hearts Dynasty graphic and Rebel Dynasty print.',
    category: 'Hoodies',
    price: 150,
    image: mid7,
    brand: 'Wild Hearts Dynasty',
    tag: 'Three colorways',
  },
]
