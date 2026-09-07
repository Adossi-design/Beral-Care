import React from 'react';
import ProfilePage from '../../components/ProfilePage';
import DoctorStanding from '../../components/DoctorStanding';

export default function Profile() {
  return (
    <>
      <DoctorStanding />
      <div className="mt-6">
        <ProfilePage role="doctor" />
      </div>
    </>
  );
}
