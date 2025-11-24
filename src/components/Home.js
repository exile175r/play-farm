import React, { useState } from 'react';

const Home = ({ farmData }) => {

  const [currentPage, setCurrentPage] = useState(1);

  // const filteredFarmData = (data, key) => {
  //   return data.filter(item => Object.keys(item).includes(key) && item[key] !== null);
  // }

  // const dataWithImg = filteredFarmData(farmData.DATA, "VILLAGE_PHOTO");
  const { DESCRIPTION: des, DATA: data } = farmData;

  const splitData = [];
  let newData = [];
  data.forEach((v, i) => {
    i += 1;
    if (i % 21 !== 0) newData.push(v);
    else {
      splitData.push(newData);
      newData = [];
    }
    if (i === data.length - 1) splitData.push(newData);
  });
  console.log("splitData:", splitData);

  return (
    <div>
      <h1>Home</h1>
      <ul className="farm-data-list">
        {splitData[currentPage - 1].map((item, i) => (
          <li key={i}>
            <div className="imgBox">
              <img src={item.VILLAGE_PHOTO ? item.VILLAGE_PHOTO : './images/temp.png'} alt="village" />
            </div>
            <div className="infoBox">
              {Object.keys(item).filter(key => key !== "VILLAGE_PHOTO").map(key => (
                <p key={key}>
                  <strong>{Object.keys(des).find(k => k === key) ? des[key] : key}</strong>
                  {key === "HMPG_ADDR" ?
                    <a href={item[key]} target="_blank" rel="noopener noreferrer">{item[key]}</a>
                    :
                    <span>{item[key]}</span>}
                </p>
              ))}
            </div>
          </li>
        ))}
      </ul>
      <div className="page-container">
        <button onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>Prev</button>
        <ul className="page-list">
          {splitData.map((_, i) => (
            <li key={i} className={currentPage === i + 1 ? "active" : ""}>
              <button onClick={() => setCurrentPage(i + 1)}>{i + 1}</button>
            </li>
          ))}
        </ul>
        <button onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === splitData.length}>Next</button>
      </div>
    </div >
  )
}

export default Home;