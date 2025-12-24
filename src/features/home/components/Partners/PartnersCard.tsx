interface PartnersCardProps {
   image: string;
}

const PartnersCard = ({ image }: PartnersCardProps) => {
   return (
      <div className="w-[270px] h-[112px] rounded-2xl">
         <div
            className="border border-blue-main flex justify-center items-center w-full h-full rounded-2xl py-4">
            <img src={image} className="h-20 w-20" alt="partners-imageCard" />
         </div>
      </div>
   );
};

export default PartnersCard;
