interface ChooseUsCardProps {
   title: string;
   text: string;
   image: string;
}

const ChooseUsCard = ({ title, text, image }: ChooseUsCardProps) => {
   return (
      <div className="max-w-[370px] rounded-2xl">
         <div className="bg-white shadow rounded-2xl flex flex-col gap-2 pt-4 pb-10 pl-6 pr-4">
            <img src={image} className="w-8 h-10 object-cover" alt="chooseUs-Image" />
            <h4 className="text-stone-950 text-xl font-bold">{text}</h4>
            <p className="text-zinc-600 text-base font-medium">{title}</p>
         </div>
      </div>
   );
};

export default ChooseUsCard;
