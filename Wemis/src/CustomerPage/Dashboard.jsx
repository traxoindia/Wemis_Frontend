import React, { useState } from 'react';
import Navbar from './Navbar';
import CustomerDashboard from './CustomerDashboard';

// Adjust path as needed

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>

      <div className="">
          <Navbar setIsModalOpen={setIsModalOpen} />
         
        </div>
        <div className=' mt-0'>
           <CustomerDashboard />
        </div>
    </>
  );
}

export default Dashboard;