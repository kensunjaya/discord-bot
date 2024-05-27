function Navbar({client}: {client: any}) {
  console.log(client?.avatar);
  return (
    <nav className="bg-bluesk min-h-screen pt-10 p-3">
      <div className="flex flex-col items-center text-center">
        <img src={client?.avatar} alt="Bot Icon" className="mx-auto mb-5"/>
        <h2 className="text-white font-semibold text-xl">{client?.username}</h2>
        <div className='text-white'>{`Tagline: ${client?.tag}`}</div>
        <div className='text-white'>{`Created: ${client?.dateCreated}`}</div>
        <div className='text-white'>{`ID: ${client?.id}`}</div>
        <div className='text-white'>{`Status: ${client?.online ? "Online" : "Offline"}`}</div>
      </div>
    </nav>
  );
}

export default Navbar;