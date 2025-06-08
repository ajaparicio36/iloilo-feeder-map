"use client";
import React from "react";
import { Button } from "../ui/button";

const LogoutButton = () => {
  const handleLogout = async () => {
    await fetch("/api/v1/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  };
  return (
    <Button onClick={handleLogout} variant="outline" className="w-full">
      Logout
    </Button>
  );
};

export default LogoutButton;
