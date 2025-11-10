import React from 'react'
import Navbar from './Navbar'
import ManageElements from './ManageElements'
import ElementTypePage from './ElementTypePage'

function SuperAdminElementTypes() {
  return (
    <div><Navbar />
            <ManageElements />
            <ElementTypePage/>
            </div>
  )
}

export default SuperAdminElementTypes