"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Pencil, Trash2, Eye, Users, Bed, Bath, Maximize, PawPrint, Check, X, Clock, Wrench, Sparkles, ChevronDown } from "lucide-react";

interface Room {
  roomID: string;
  roomNumber: string;
  roomType: string;
  description: string;
  price: number;
  roomStatus: string;
  floor: number;
  roomSize: number;
  bed: number;
  person: number;
  bathroom: number;
  isPetAllowed: boolean;
  images: string[];
}

interface RoomCardProps {
  room: Room;
  onDelete: (roomID: string) => void;
  onStatusChange?: (roomID: string, newStatus: string) => void;
}

export default function RoomCard({ room, onDelete, onStatusChange }: RoomCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const statusConfig = {
    available: { 
      color: "bg-green-100 text-green-800", 
      icon: Check, 
      label: "Available",
      bgColor: "bg-green-100",
      textColor: "text-green-800",
      hoverColor: "hover:bg-green-200"
    },
    occupied: { 
      color: "bg-red-100 text-red-800", 
      icon: X, 
      label: "Occupied",
      bgColor: "bg-red-100",
      textColor: "text-red-800",
      hoverColor: "hover:bg-red-200"
    },
    maintenance: { 
      color: "bg-yellow-100 text-yellow-800", 
      icon: Wrench, 
      label: "Maintenance",
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-800",
      hoverColor: "hover:bg-yellow-200"
    },
    cleaning: { 
      color: "bg-blue-100 text-blue-800", 
      icon: Sparkles, 
      label: "Cleaning",
      bgColor: "bg-blue-100",
      textColor: "text-blue-800",
      hoverColor: "hover:bg-blue-200"
    },
  };

  const config = statusConfig[room.roomStatus as keyof typeof statusConfig] || statusConfig.available;
  const Icon = config.icon;

  const handleStatusChange = async (newStatus: string) => {
    if (newStatus === room.roomStatus) {
      setShowDropdown(false);
      return;
    }
    
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/rooms/${room.roomID}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error('Failed to update status');
      
      if (onStatusChange) {
        onStatusChange(room.roomID, newStatus);
      }
      setShowDropdown(false);
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update room status');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      {/* Image Gallery */}
      <div className="relative h-48 bg-gray-200">
        {room.images && room.images.length > 0 ? (
          <Image
            src={room.images[0]}
            alt={room.roomType}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            No Image
          </div>
        )}
        
        {/* Status Badge with Dropdown */}
        <div className="absolute top-2 right-2 z-10">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              disabled={isUpdating}
              className={`${config.color} px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1 hover:opacity-80 transition-opacity shadow-sm`}
            >
              <Icon size={14} />
              {config.label}
              {isUpdating ? (
                <Clock size={14} className="animate-spin ml-1" />
              ) : (
                <ChevronDown size={14} className="ml-1" />
              )}
            </button>

            {showDropdown && (
              <>
                <div 
                  className="fixed inset-0 z-20" 
                  onClick={() => setShowDropdown(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl z-30 py-1 border">
                  {Object.entries(statusConfig).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => handleStatusChange(key)}
                      className={`w-full text-left px-4 py-2.5 flex items-center gap-2 text-sm ${
                        key === room.roomStatus 
                          ? config.bgColor + ' ' + config.textColor
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <config.icon size={16} className={config.textColor} />
                      <span className="flex-1">{config.label}</span>
                      {key === room.roomStatus && <Check size={16} className="text-green-600" />}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Room Details */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="text-lg font-semibold">Room {room.roomNumber}</h3>
            <p className="text-sm text-gray-600">{room.roomType}</p>
          </div>
          <p className="text-xl font-bold text-blue-600">${room.price}/night</p>
        </div>

        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{room.description}</p>

        {/* Amenities */}
        <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
          <div className="flex items-center gap-1 text-gray-600">
            <Users size={16} />
            <span>{room.person} Guests</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Bed size={16} />
            <span>{room.bed} Bed</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Bath size={16} />
            <span>{room.bathroom} Bath</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <Maximize size={16} />
            <span>{room.roomSize} m²</span>
          </div>
          <div className="flex items-center gap-1 text-gray-600">
            <span>Floor {room.floor}</span>
          </div>
          {room.isPetAllowed && (
            <div className="flex items-center gap-1 text-gray-600">
              <PawPrint size={16} />
              <span>Pets Allowed</span>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-4">
          <Link
            href={`/rooms/${room.roomID}`}
            className="flex-1 bg-gray-100 text-gray-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Eye size={16} />
            View
          </Link>
          <Link
            href={`/rooms/edit/${room.roomID}`}
            className="flex-1 bg-blue-100 text-blue-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-blue-200 transition-colors"
          >
            <Pencil size={16} />
            Edit
          </Link>
          <button
            onClick={() => onDelete(room.roomID)}
            className="flex-1 bg-red-100 text-red-700 px-3 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-200 transition-colors"
          >
            <Trash2 size={16} />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}