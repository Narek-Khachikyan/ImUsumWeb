interface TitleProps {
   text: string;
}

const Title = ({ text }: TitleProps) => {
   return <h2 className="text-blue-600 text-5xl font-semibold mb-10 text-center">{text}</h2>;
};

export default Title;
