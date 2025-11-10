import React from 'react'
import ManageElements from './ManageElements'
import Navbar from './Navbar'
import ElementPage from './ElementPage'

function SuperAdminElement() {
    return (
        <div>
            <Navbar />
            <ManageElements />
            <ElementPage/>
        </div>
    )
}

export default SuperAdminElement