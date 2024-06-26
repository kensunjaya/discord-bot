import Navbar from "../components/navbar";

const People = () => {
  return (
    <div>
      <Navbar active="people"/>
      <div className="ml-64 p-5 text-sm w-full">All discord users that are recognized by this bot will be shown here</div>
    </div>
  );
};

export default People;