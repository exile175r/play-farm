import React, { useState, useEffect } from 'react';

const Home = ({ farmData }) => {

  const [allData, setAllData] = useState([]);
  const [district, setDistrict] = useState('');
  const [sigungu, setSigungu] = useState('');
  const [experience, setExperience] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [startPage, setStartPage] = useState(1); // 페이지 버튼 범위 시작점

  const { DESCRIPTION: des, DATA: data } = farmData;

  // 데이터 분할
  const splitData = (dataToSplit) => {
    const splitData = [];
    let newData = [];
    dataToSplit.forEach((v, i) => {
      newData.push(v);
      if ((i + 1) % 20 === 0) {
        splitData.push(newData);
        newData = [];
      }
    });
    if (newData.length) splitData.push(newData);
    setAllData(splitData);
    setCurrentPage(1); // 필터링 시 첫 페이지로 리셋
    setStartPage(1); // 페이지 버튼 범위도 리셋
  }

  // 필터링 및 데이터 분할
  useEffect(() => {
    const filteredData = data.filter(item => {
      // district 필터
      if (district) {
        const addr1 = item.RDNMADR?.split(' ')[0];
        const addr2 = item.REFINE_LOTNO_ADDR?.split(' ')[0];
        const addr3 = item.REFINE_ROADNM_ADDR?.split(' ')[0];
        if (addr1 !== district && addr2 !== district && addr3 !== district) {
          return false;
        }
      }
      // sigungu 필터
      if (sigungu) {
        const addr1 = item.RDNMADR?.split(' ')[1];
        const addr2 = item.REFINE_LOTNO_ADDR?.split(' ')[1];
        const addr3 = item.REFINE_ROADNM_ADDR?.split(' ')[1];
        if (addr1 !== sigungu && addr2 !== sigungu && addr3 !== sigungu) {
          return false;
        }
      }
      // experience 필터
      if (experience) {
        const programTypes = item.PROGRAM_TYPE?.split('+') || [];
        if (!programTypes.some(v => v.includes('체험') && v === experience)) {
          return false;
        }
      }
      return true;
    });
    splitData(filteredData);
  }, [data, district, sigungu, experience]);

  console.log("allData:", allData);

  // 중복 제거
  const uniqueList = (list) => {
    const newList = [];
    list.forEach(v => {
      if (newList.includes(v)) return;
      newList.push(v);
    });
    return newList;
  }

  // 주소 리스트 생성
  const addressList = [];
  const siguNm = (address) => address && address.split(' ').slice(0, 2).join(' ');
  data.forEach(item => {
    if (
      (Object.keys(item).includes('RDNMADR') && item.RDNMADR)
      ||
      (Object.keys(item).includes('REFINE_LOTNO_ADDR') && item.REFINE_LOTNO_ADDR)
      ||
      (Object.keys(item).includes('REFINE_ROADNM_ADDR') && item.REFINE_ROADNM_ADDR)
    ) {
      if (
        addressList.length &&
        addressList.includes(
          siguNm(item.RDNMADR)
          || siguNm(item.REFINE_LOTNO_ADDR)
          || siguNm(item.REFINE_ROADNM_ADDR)
        )) return;
      addressList.push(siguNm(item.RDNMADR) || siguNm(item.REFINE_LOTNO_ADDR) || siguNm(item.REFINE_ROADNM_ADDR));
    }
  });
  // console.log("addressList:", addressList);

  // 체험 리스트 생성
  const experienceList = [];
  data.forEach(item => {
    if (item.PROGRAM_TYPE) {
      item.PROGRAM_TYPE.split('+').map(v => {
        if (v.includes('체험')) experienceList.push(v);
        return null;
      })
    }
  });
  // console.log("experienceList:", experienceList);


  return (
    <div>
      <div className="category-container">
        <label htmlFor="district">지역</label>
        <select name="district" id="district" onChange={(e) => setDistrict(e.target.value)}>
          <option value="">전체</option>
          {uniqueList(addressList.map(v => v.split(' ')[0])).map((address, i) => {
            return <option key={i + 1} value={address}>{address}</option>
          })}
        </select>
        <label htmlFor="sigungu">도시</label>
        <select name="" id="" onChange={(e) => setSigungu(e.target.value)}>
          <option value="">전체</option>
          {uniqueList(addressList.map(v => district ? v.split(' ')[0] === district && v.split(' ')[1] : v.split(' ')[1]))
            .filter(v => v)
            .map((address, i) => {
              return <option key={i + 1} value={address}>{address}</option>
            })}
        </select>
        <label>체험</label>
        <select name="experience" id="experience" onChange={(e) => setExperience(e.target.value)}>
          <option value="">전체</option>
          {uniqueList(experienceList).map((experience, i) => {
            return <option key={i + 1} value={experience}>{experience}</option>
          })}
        </select>
      </div>
      <ul className="farm-data-list">
        {allData[currentPage - 1]?.map((item, i) => (
          <li key={i}>
            <div className="imgBox">
              <img src={item.VILLAGE_PHOTO ? item.VILLAGE_PHOTO : `${process.env.PUBLIC_URL || ''}/images/temp.png`} alt="village" />
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
        <button
          onClick={() => {
            if (currentPage > 1) {
              setCurrentPage(currentPage - 1);
              // 현재 페이지가 표시 범위 밖이면 범위 조정
              if (currentPage - 1 < startPage) {
                setStartPage(Math.max(1, currentPage - 1));
              }
            }
          }}
          disabled={currentPage === 1}
        >
          Prev
        </button>
        <ul className="page-list">
          {allData?.slice(startPage - 1, Math.min(startPage + 29, allData.length)).map((_, i) => {
            const pageNum = startPage + i;
            return (
              <li key={pageNum - 1} className={currentPage === pageNum ? "active" : ""}>
                <button onClick={() => {
                  setCurrentPage(pageNum);
                  // 현재 페이지가 표시 범위 밖이면 범위 조정
                  if (pageNum >= startPage + 30) {
                    setStartPage(pageNum - 29);
                  } else if (pageNum < startPage) {
                    setStartPage(Math.max(1, pageNum));
                  }
                }}>
                  {pageNum}
                </button>
              </li>
            );
          })}
        </ul>
        <button
          onClick={() => {
            if (currentPage < allData.length) {
              setCurrentPage(currentPage + 1);
              // 현재 페이지가 표시 범위 밖이면 범위 조정
              if (currentPage + 1 >= startPage + 30) {
                setStartPage(Math.min(allData.length - 29, currentPage + 1 - 29));
              }
            }
          }}
          disabled={currentPage === allData.length}
        >
          Next
        </button>
      </div>
    </div >
  )
}

export default Home;