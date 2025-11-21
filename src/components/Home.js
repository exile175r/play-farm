const Home = ({ farmData }) => {
  return (
    <div>
      <h1>Home</h1>
      <ul className="farm-data-list">
        {farmData.DATA.map((item, i) => (
          <li key={i}>
            {Object.keys(item).map((key) => (
              <p key={key}>
                <strong>
                  {Object.keys(farmData.DESCRIPTION).find(k => k === key) ? farmData.DESCRIPTION[key] : key}
                </strong>
                <span>{item[key]}</span>
              </p>
            ))}
          </li>
        ))}
      </ul>
    </div >
  )
}

export default Home;